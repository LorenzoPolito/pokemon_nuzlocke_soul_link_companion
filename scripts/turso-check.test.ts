/**
 * Verifies the app's database code against a real Turso database (P3-03).
 * Skipped unless TURSO_URL and TURSO_TOKEN are set:
 *   TURSO_URL=libsql://… TURSO_TOKEN=… npm run turso:check
 * It applies the migrations to that database and runs an idempotency round trip.
 * Use a test database: the app's tables are created there.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/lib/server/config';
import { openDatabase } from '../src/lib/server/database/client';
import { runIdempotent } from '../src/lib/server/database/idempotency';
import { runMigrations } from '../src/lib/server/database/migrate';

const enabled = Boolean(process.env.TURSO_URL && process.env.TURSO_TOKEN);

describe.skipIf(!enabled)('Turso database', () => {
	const { database } = loadConfig(process.env);
	const migrations = process.env.MIGRATIONS_DIR ?? './drizzle';
	const userId = `turso-check-${Date.now()}`;
	const connection = enabled ? openDatabase(database) : Promise.reject(new Error('disabled'));
	connection.catch(() => undefined);

	afterAll(async () => {
		const { client } = await connection;
		await client.execute({ sql: 'DELETE FROM request_key WHERE user_id = ?', args: [userId] });
		client.close();
	});

	it('uses the remote database, not a local file', () => {
		expect(database.kind).toBe('turso');
	});

	it('connects', async () => {
		const { client } = await connection;
		const rows = await client.execute('SELECT 1 AS one');
		expect(Number(rows.rows[0]?.one)).toBe(1);
	});

	it('applies the migrations, and a second run changes nothing', async () => {
		const opened = await connection;
		await runMigrations(opened, database, migrations);
		await runMigrations(opened, database, migrations);
		await opened.client.execute('SELECT * FROM request_key LIMIT 1');
	});

	it('stores and replays an idempotent response', async () => {
		const { db } = await connection;
		const request = { userId, key: 'k1', method: 'POST', path: '/check', body: '{}' };
		let calls = 0;
		const handler = async () => ({ status: 201, body: `{"call":${++calls}}` });
		const first = await runIdempotent(db, request, handler);
		const second = await runIdempotent(db, request, handler);
		expect(calls).toBe(1);
		expect(first.replayed).toBe(false);
		expect(second).toMatchObject({ replayed: true, body: first.body });
	});
});
