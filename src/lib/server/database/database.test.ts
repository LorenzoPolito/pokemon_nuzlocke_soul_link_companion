import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../config';
import { openDatabase, type Connection } from './client';
import {
	checkKey,
	hashRequest,
	IDEMPOTENCY_TTL_MS,
	purgeExpiredKeys,
	runIdempotent,
	storeResponse
} from './idempotency';
import { MigrationError, runMigrations } from './migrate';

const MIGRATIONS = join(process.cwd(), 'drizzle');
let dir: string;
let config: DatabaseConfig;
let connection: Connection;

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-db-'));
	config = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

describe('transactions', () => {
	it('wait their turn instead of failing with SQLITE_BUSY when several run at once', async () => {
		await connection.client.execute('create table t (n integer)');
		const order: number[] = [];
		await Promise.all(
			[1, 2, 3, 4, 5].map((n) =>
				connection.db.transaction(async (tx) => {
					await tx.run(sql`insert into t values (${n})`);
					await new Promise((resolve) => setTimeout(resolve, 5));
					order.push(n);
				})
			)
		);
		expect(order).toEqual([1, 2, 3, 4, 5]);
		const count = await connection.client.execute('select count(*) as c from t');
		expect(Number(count.rows[0]?.c)).toBe(5);
	});

	it('go on after one of them fails', async () => {
		await expect(
			connection.db.transaction(async () => {
				throw new Error('boom');
			})
		).rejects.toThrow('boom');
		await expect(connection.db.transaction(async () => 'fine')).resolves.toBe('fine');
	});
});

describe('openDatabase', () => {
	it('turns on WAL and foreign keys for a local file', async () => {
		const mode = await connection.client.execute('PRAGMA journal_mode');
		const fk = await connection.client.execute('PRAGMA foreign_keys');
		expect(mode.rows[0]?.journal_mode).toBe('wal');
		expect(Number(fk.rows[0]?.foreign_keys)).toBe(1);
	});
});

describe('runMigrations', () => {
	it('applies migrations on a new database and again without changes', async () => {
		await runMigrations(connection, config, MIGRATIONS);
		await runMigrations(connection, config, MIGRATIONS);
		const rows = await connection.client.execute('SELECT COUNT(*) AS n FROM __drizzle_migrations');
		expect(Number(rows.rows[0]?.n)).toBeGreaterThanOrEqual(1);
		await connection.client.execute('SELECT * FROM request_key');
	});

	it('does not copy the file when no migration is pending', async () => {
		await runMigrations(connection, config, MIGRATIONS);
		await runMigrations(connection, config, MIGRATIONS);
		expect(existsSync(`${dir}/app.db.before-migration`)).toBe(false);
	});

	it('copies the file before pending migrations on a database that already has data', async () => {
		const partial = join(dir, 'partial');
		cpSync(MIGRATIONS, partial, { recursive: true });
		const journalPath = join(partial, 'meta', '_journal.json');
		const full = JSON.parse((await import('node:fs')).readFileSync(journalPath, 'utf8'));
		// Pretend the app shipped one more migration than the database has applied.
		await runMigrations(connection, config, MIGRATIONS);
		const next = {
			...full,
			entries: [
				...full.entries,
				{ ...full.entries[0], idx: full.entries.length, tag: '0099_fake', when: Date.now() + 1 }
			]
		};
		writeFileSync(journalPath, JSON.stringify(next));
		writeFileSync(join(partial, '0099_fake.sql'), 'CREATE TABLE fake_table (id integer);');
		await runMigrations(connection, config, partial);
		expect(existsSync(`${dir}/app.db.before-migration`)).toBe(true);
	});

	it('stops with a clear error when a migration fails', async () => {
		const broken = join(dir, 'broken');
		cpSync(MIGRATIONS, broken, { recursive: true });
		const { readFileSync } = await import('node:fs');
		const journalPath = join(broken, 'meta', '_journal.json');
		const full = JSON.parse(readFileSync(journalPath, 'utf8'));
		const next = {
			...full,
			entries: [
				...full.entries,
				{ ...full.entries[0], idx: full.entries.length, tag: '0098_bad', when: Date.now() + 1 }
			]
		};
		writeFileSync(journalPath, JSON.stringify(next));
		writeFileSync(join(broken, '0098_bad.sql'), 'THIS IS NOT SQL;');
		await expect(runMigrations(connection, config, broken)).rejects.toThrow(MigrationError);
		await expect(runMigrations(connection, config, broken)).rejects.toThrow(/cannot start/);
	});
});

describe('idempotency', () => {
	const now = 1_790_000_000_000;
	beforeEach(async () => {
		await runMigrations(connection, config, MIGRATIONS);
	});

	it('hashes method, path and body', () => {
		expect(hashRequest('POST', '/a', '{}')).not.toBe(hashRequest('POST', '/b', '{}'));
		expect(hashRequest('POST', '/a', '{}')).toBe(hashRequest('POST', '/a', '{}'));
	});

	it('replays a stored response and rejects a different request with the same key', async () => {
		const h = hashRequest('POST', '/api/runs', '{"name":"a"}');
		expect((await checkKey(connection.db, 'u1', 'k1', h, now)).kind).toBe('fresh');
		await storeResponse(connection.db, 'u1', 'k1', h, { status: 201, body: '{"id":"r1"}' }, now);
		expect(await checkKey(connection.db, 'u1', 'k1', h, now + 1000)).toEqual({
			kind: 'replay',
			response: { status: 201, body: '{"id":"r1"}' }
		});
		expect((await checkKey(connection.db, 'u1', 'k1', 'other', now)).kind).toBe('mismatch');
		expect((await checkKey(connection.db, 'u2', 'k1', h, now)).kind).toBe('fresh');
	});

	it('keeps the first response when two requests race', async () => {
		const h = hashRequest('POST', '/x', '');
		await storeResponse(connection.db, 'u', 'k', h, { status: 200, body: 'first' }, now);
		await storeResponse(connection.db, 'u', 'k', h, { status: 200, body: 'second' }, now);
		const outcome = await checkKey(connection.db, 'u', 'k', h, now);
		expect(outcome).toMatchObject({ kind: 'replay', response: { body: 'first' } });
	});

	it('ignores keys older than 24 hours and purges them', async () => {
		const h = hashRequest('POST', '/x', '');
		await storeResponse(connection.db, 'u', 'old', h, { status: 200, body: 'x' }, now);
		await storeResponse(
			connection.db,
			'u',
			'new',
			h,
			{ status: 200, body: 'y' },
			now + IDEMPOTENCY_TTL_MS
		);
		const later = now + IDEMPOTENCY_TTL_MS + 1;
		expect((await checkKey(connection.db, 'u', 'old', h, later)).kind).toBe('fresh');
		expect(await purgeExpiredKeys(connection.db, later)).toBe(1);
		expect((await checkKey(connection.db, 'u', 'new', h, later)).kind).toBe('replay');
	});

	it('runs the handler once per key', async () => {
		let calls = 0;
		const request = { userId: 'u', key: 'k', method: 'POST', path: '/p', body: '{}' };
		const handler = async () => {
			calls += 1;
			return { status: 201, body: '{"ok":true}' };
		};
		const first = await runIdempotent(connection.db, request, handler, now);
		const second = await runIdempotent(connection.db, request, handler, now + 1);
		expect(calls).toBe(1);
		expect(first.replayed).toBe(false);
		expect(second).toMatchObject({ replayed: true, status: 201, body: '{"ok":true}' });
		const mismatch = await runIdempotent(
			connection.db,
			{ ...request, body: '{"x":1}' },
			handler,
			now
		);
		expect(mismatch.status).toBe(409);
		expect(mismatch.body).toContain('idempotency_mismatch');
	});

	it('does not store server errors, so they can be retried', async () => {
		let calls = 0;
		const request = { userId: 'u', key: 'k5', method: 'POST', path: '/p', body: '' };
		const handler = async () => {
			calls += 1;
			return calls === 1 ? { status: 500, body: 'boom' } : { status: 200, body: 'ok' };
		};
		expect((await runIdempotent(connection.db, request, handler, now)).status).toBe(500);
		expect((await runIdempotent(connection.db, request, handler, now)).status).toBe(200);
	});
});
