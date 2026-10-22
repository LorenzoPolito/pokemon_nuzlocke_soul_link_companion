import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { authorize } from '../auth/index';
import { user } from '../auth/infrastructure/schema';
import { createRun, createRunOnce, getRun, listRuns } from './index';
import { run, runMember } from './infrastructure/schema';

let dir: string;
let connection: Connection;

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-runs-'));
	const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
	await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	const now = new Date();
	await connection.db.insert(user).values(
		['ana', 'ben', 'cleo'].map((id) => ({
			id,
			name: id.toUpperCase(),
			email: `${id}@example.test`,
			createdAt: now,
			updatedAt: now
		}))
	);
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

const deps = (extra = {}) => ({ db: connection.db, ...extra });
const create = async (owner: string, body: unknown) => {
	const result = await createRun(deps(), owner, body);
	if (!result.ok) throw new Error(result.error);
	return result.run;
};

describe('createRun', () => {
	it('creates the run with the defaults and makes the creator owner and first player', async () => {
		const created = await create('ana', { name: '  Hardcore  ', gameId: 'black' });
		expect(created.name).toBe('Hardcore');
		const [row] = await connection.db.select().from(run);
		expect(row).toMatchObject({
			id: created.id,
			ownerId: 'ana',
			gameId: 'black',
			status: 'active',
			settingsSchema: 1,
			startedInProgress: false,
			version: 1
		});
		expect(row!.gameDataVersion).toMatch(/^\d{4}\./);
		expect(JSON.parse(row!.settings)).toEqual({
			dupesClause: true,
			typeClause: false,
			separateGifts: true,
			separateRooms: true,
			randomizer: false,
			damageCalculator: true
		});
		const members = await connection.db.select().from(runMember);
		expect(members).toHaveLength(1);
		expect(members[0]).toMatchObject({ runId: created.id, userId: 'ana', role: 'owner', seat: 1 });
	});

	it('stores the chosen rules and, for Black 2 and White 2, the difficulty', async () => {
		const a = await create('ana', {
			name: 'Due',
			gameId: 'white-2',
			settings: { typeClause: true, randomizer: true, difficulty: 'challenge' }
		});
		expect(a.settings).toMatchObject({
			typeClause: true,
			randomizer: true,
			difficulty: 'challenge'
		});
		const b = await create('ana', { name: 'Due bis', gameId: 'black-2' });
		expect(b.settings).toMatchObject({ difficulty: 'normal' });
	});

	it('refuses invalid names, games and rules', async () => {
		for (const body of [
			{ name: '', gameId: 'black' },
			{ name: '   ', gameId: 'black' },
			{ name: 'x'.repeat(61), gameId: 'black' },
			{ name: 'Ok', gameId: 'red' },
			{ name: 'Ok' },
			{ name: 'Ok', gameId: 'black', settings: { oneEncounterPerArea: false } },
			{ name: 'Ok', gameId: 'black', settings: { dupesClause: 'yes' } },
			null
		]) {
			expect(await createRun(deps(), 'ana', body)).toMatchObject({
				ok: false,
				error: 'validation'
			});
		}
		expect(await connection.db.select().from(run)).toHaveLength(0);
	});

	it('refuses a difficulty for a game that has none', async () => {
		expect(
			await createRun(deps(), 'ana', {
				name: 'Ok',
				gameId: 'black',
				settings: { difficulty: 'easy' }
			})
		).toEqual({ ok: false, error: 'difficulty_not_available' });
		expect(await connection.db.select().from(run)).toHaveLength(0);
	});

	it('leaves nothing behind when the owner does not exist', async () => {
		await expect(createRun(deps(), 'nobody', { name: 'Ok', gameId: 'black' })).rejects.toThrow();
		expect(await connection.db.select().from(run)).toHaveLength(0);
		expect(await connection.db.select().from(runMember)).toHaveLength(0);
	});

	it('writes the run.created entry in the diary', async () => {
		const events: unknown[] = [];
		const result = await createRun(deps({ publish: async (e: unknown) => events.push(e) }), 'ana', {
			name: 'Diario',
			gameId: 'white'
		});
		expect(result.ok).toBe(true);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({ type: 'run.created', entity: 'run', actorUserId: 'ana' });
	});
});

describe('database constraints', () => {
	it('allows one owner and one player per seat in a run', async () => {
		const created = await create('ana', { name: 'Vincoli', gameId: 'black' });
		const base = { runId: created.id, createdAt: 1, updatedAt: 1 };
		await expect(
			connection.db
				.insert(runMember)
				.values({ ...base, id: 'm2', userId: 'ben', role: 'owner', seat: 2 })
		).rejects.toThrow();
		await expect(
			connection.db
				.insert(runMember)
				.values({ ...base, id: 'm3', userId: 'ben', role: 'player', seat: 1 })
		).rejects.toThrow();
		await expect(
			connection.db
				.insert(runMember)
				.values({ ...base, id: 'm4', userId: 'ana', role: 'spectator', seat: null })
		).rejects.toThrow();
		await connection.db
			.insert(runMember)
			.values({ ...base, id: 'm5', userId: 'ben', role: 'spectator', seat: null });
	});

	it('rejects a status, a role and a level cap outside the allowed values', async () => {
		const created = await create('ana', { name: 'Check', gameId: 'black' });
		await expect(
			connection.client.execute({
				sql: 'update run set status = ? where id = ?',
				args: ['paused', created.id]
			})
		).rejects.toThrow();
		await expect(
			connection.client.execute({
				sql: 'update run set level_cap_override = 101 where id = ?',
				args: [created.id]
			})
		).rejects.toThrow();
		await expect(
			connection.client.execute({
				sql: "update run_member set role = 'boss' where run_id = ?",
				args: [created.id]
			})
		).rejects.toThrow();
	});

	it('deletes the members with the run', async () => {
		const created = await create('ana', { name: 'Cascata', gameId: 'black' });
		await connection.db.delete(run).where(eq(run.id, created.id));
		expect(await connection.db.select().from(runMember)).toHaveLength(0);
	});
});

describe('listRuns', () => {
	it('lists only the runs of the user, newest activity first, with the summary', async () => {
		const first = await create('ana', { name: 'Prima', gameId: 'black' });
		await create('ben', { name: 'Di Ben', gameId: 'white' });
		const third = await create('ana', {
			name: 'Terza',
			gameId: 'black-2',
			settings: { randomizer: true }
		});
		await connection.db
			.update(run)
			.set({ updatedAt: 5_000_000_000_000 })
			.where(eq(run.id, first.id));
		const items = await listRuns(connection.db, 'ana');
		expect(items.map((i) => i.name)).toEqual(['Prima', 'Terza']);
		expect(items[1]).toMatchObject({
			id: third.id,
			gameId: 'black-2',
			generation: 5,
			players: 1,
			status: 'active',
			role: 'owner',
			randomizer: true,
			summary: { badges: 0, alive: 0, dead: 0 }
		});
		expect(await listRuns(connection.db, 'cleo')).toEqual([]);
	});

	it('filters by state and counts players but not spectators', async () => {
		const open = await create('ana', { name: 'Aperta', gameId: 'black' });
		const done = await create('ana', { name: 'Finita', gameId: 'black' });
		await connection.db.update(run).set({ status: 'lost' }).where(eq(run.id, done.id));
		const base = { createdAt: 1, updatedAt: 1 };
		await connection.db.insert(runMember).values([
			{ ...base, id: 'p', runId: open.id, userId: 'ben', role: 'player', seat: 2 },
			{ ...base, id: 's', runId: open.id, userId: 'cleo', role: 'spectator', seat: null },
			{
				...base,
				id: 'w',
				runId: open.id,
				userId: null,
				displayName: 'Luca',
				role: 'player',
				seat: 3
			}
		]);
		expect((await listRuns(connection.db, 'ana', { filter: 'active' })).map((i) => i.name)).toEqual(
			['Aperta']
		);
		expect((await listRuns(connection.db, 'ana', { filter: 'ended' })).map((i) => i.name)).toEqual([
			'Finita'
		]);
		expect(await listRuns(connection.db, 'ana', { filter: 'all' })).toHaveLength(2);
		const [item] = await listRuns(connection.db, 'ana', { filter: 'active' });
		expect(item!.players).toBe(3);
		const [asSpectator] = await listRuns(connection.db, 'cleo');
		expect(asSpectator).toMatchObject({ role: 'spectator', name: 'Aperta' });
	});

	it('hides deleted runs, and shows them to their owner only when asked', async () => {
		const gone = await create('ana', { name: 'Cancellata', gameId: 'black' });
		await connection.db.update(run).set({ deletedAt: 1 }).where(eq(run.id, gone.id));
		await connection.db.insert(runMember).values({
			id: 'g',
			runId: gone.id,
			userId: 'ben',
			role: 'player',
			seat: 2,
			createdAt: 1,
			updatedAt: 1
		});
		expect(await listRuns(connection.db, 'ana')).toEqual([]);
		expect((await listRuns(connection.db, 'ana', { deleted: true })).map((i) => i.name)).toEqual([
			'Cancellata'
		]);
		expect(await listRuns(connection.db, 'ben', { deleted: true })).toEqual([]);
	});
});

describe('getRun', () => {
	it('returns the run with its members to a member', async () => {
		const created = await create('ana', { name: 'Dettaglio', gameId: 'white-2' });
		await connection.db.insert(runMember).values([
			{
				id: 'w',
				runId: created.id,
				userId: null,
				displayName: 'Luca',
				role: 'player',
				seat: 2,
				createdAt: 2,
				updatedAt: 2
			},
			{
				id: 's',
				runId: created.id,
				userId: 'ben',
				role: 'spectator',
				seat: null,
				createdAt: 3,
				updatedAt: 3
			}
		]);
		const found = await getRun(connection.db, 'ben', created.id);
		expect(found!.run).toMatchObject({ name: 'Dettaglio', gameId: 'white-2', status: 'active' });
		expect(found!.run.members.map((m) => [m.name, m.role, m.seat, m.pending])).toEqual([
			['ANA', 'owner', 1, false],
			['Luca', 'player', 2, true],
			['BEN', 'spectator', null, false]
		]);
		expect(found!.context).toEqual({ memberRole: 'spectator', status: 'active', deleted: false });
	});

	it('does not reveal a run to someone who is not a member, nor an unknown id', async () => {
		const created = await create('ana', { name: 'Segreta', gameId: 'black' });
		expect(await getRun(connection.db, 'cleo', created.id)).toBeNull();
		expect(await getRun(connection.db, 'ana', 'unknown')).toBeNull();
	});

	it('gives authorize what it needs: the owner may update, a spectator may only read', async () => {
		const created = await create('ana', { name: 'Permessi', gameId: 'black' });
		await connection.db.insert(runMember).values({
			id: 's',
			runId: created.id,
			userId: 'ben',
			role: 'spectator',
			seat: null,
			createdAt: 1,
			updatedAt: 1
		});
		const actor = (id: string) => ({
			id,
			role: 'user' as const,
			disabled: false,
			mustChangePassword: false
		});
		const owner = await getRun(connection.db, 'ana', created.id);
		const spectator = await getRun(connection.db, 'ben', created.id);
		expect(authorize(actor('ana'), 'run.update', { run: owner!.context })).toEqual({
			allowed: true
		});
		expect(authorize(actor('ben'), 'run.read', { run: spectator!.context })).toEqual({
			allowed: true
		});
		expect(authorize(actor('ben'), 'run.update', { run: spectator!.context })).toEqual({
			allowed: false,
			reason: 'forbidden'
		});
	});
});

describe('createRunOnce', () => {
	const send = (key: string, body: unknown, userId = 'ana') =>
		createRunOnce(
			deps(),
			userId,
			key,
			'/api/runs',
			typeof body === 'string' ? body : JSON.stringify(body)
		);

	it('creates one run per key: a repeated request returns the first answer', async () => {
		const body = { name: 'Una sola', gameId: 'black' };
		const first = await send('k1', body);
		const second = await send('k1', body);
		expect(first).toMatchObject({ status: 201, replayed: false });
		expect(second).toMatchObject({ status: 201, replayed: true, body: first.body });
		expect(await connection.db.select().from(run)).toHaveLength(1);
	});

	it('rejects the same key with another body', async () => {
		await send('k2', { name: 'Prima', gameId: 'black' });
		const clash = await send('k2', { name: 'Seconda', gameId: 'white' });
		expect(clash.status).toBe(409);
		expect(JSON.parse(clash.body).error.code).toBe('idempotency_mismatch');
		expect(await connection.db.select().from(run)).toHaveLength(1);
	});

	it('answers 422 with a code for invalid data and 400 for a body that is not JSON', async () => {
		const invalid = await send('k3', { name: '', gameId: 'black' });
		expect(invalid.status).toBe(422);
		expect(JSON.parse(invalid.body).error.code).toBe('validation');
		const difficulty = await send('k4', {
			name: 'A',
			gameId: 'black',
			settings: { difficulty: 'easy' }
		});
		expect(JSON.parse(difficulty.body).error.code).toBe('difficulty_not_available');
		const broken = await send('k5', '{not json');
		expect(broken.status).toBe(400);
		expect(JSON.parse(broken.body).error.code).toBe('bad_request');
	});

	it('keeps the keys of different users apart', async () => {
		const body = { name: 'Stessa chiave', gameId: 'black' };
		await send('same', body, 'ana');
		const other = await send('same', body, 'ben');
		expect(other.replayed).toBe(false);
		expect(await connection.db.select().from(run)).toHaveLength(2);
	});
});
