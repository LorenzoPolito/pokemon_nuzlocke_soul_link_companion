import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { invite } from '../auth/infrastructure/schema';
import { user } from '../auth/infrastructure/schema';
import { runMemberAccess } from '../realtime/infrastructure/run-access';
import {
	acceptInvite,
	changeMember,
	createRun,
	createRunInvite,
	declineInvite,
	getRun,
	handOverRuns,
	listRunInvites,
	previewInvite,
	removeMember,
	requireRun,
	revokeRunInvite,
	transferOwnership
} from './index';
import { run, runMember } from './infrastructure/schema';

let dir: string;
let connection: Connection;
let events: { type: string; runId: string }[];
let disconnected: string[];
let clock = 1_000_000;

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-members-'));
	const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
	await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	const now = new Date();
	await connection.db.insert(user).values(
		['ana', 'ben', 'cleo', 'dina'].map((id) => ({
			id,
			name: id.toUpperCase(),
			email: `${id}@example.test`,
			createdAt: now,
			updatedAt: now
		}))
	);
	events = [];
	disconnected = [];
	clock = 1_000_000;
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

const deps = () => ({
	db: connection.db,
	now: () => clock,
	publish: async (e: { type: string; runId: string }) => {
		events.push(e);
	},
	disconnect: (_runId: string, userId: string) => {
		disconnected.push(userId);
	}
});

const actor = (id: string) => ({
	id,
	role: 'user' as const,
	disabled: false,
	mustChangePassword: false
});

const start = async (body: Record<string, unknown> = {}) => {
	const result = await createRun(deps(), 'ana', { name: 'Gruppo', gameId: 'black', ...body });
	if (!result.ok) throw new Error(result.error);
	return result.run;
};

const members = (runId: string) =>
	connection.db.select().from(runMember).where(eq(runMember.runId, runId));

describe('createRun with seats', () => {
	it('reserves a pending seat and an invitation for each person', async () => {
		const created = await start({
			seats: [
				{ name: 'Luca', role: 'player' },
				{ name: 'Marta', role: 'spectator' },
				{ name: 'Nico', role: 'player' }
			]
		});
		expect(created.invites.map((i) => [i.name, i.role])).toEqual([
			['Luca', 'player'],
			['Marta', 'spectator'],
			['Nico', 'player']
		]);
		expect(created.invites.every((i) => i.token.length >= 30)).toBe(true);
		const rows = await members(created.id);
		expect(rows.map((r) => [r.displayName, r.userId, r.role, r.seat])).toEqual(
			expect.arrayContaining([
				[null, 'ana', 'owner', 1],
				['Luca', null, 'player', 2],
				['Marta', null, 'spectator', null],
				['Nico', null, 'player', 3]
			])
		);
		// The token is not stored in clear.
		const stored = await connection.db.select().from(invite);
		expect(stored).toHaveLength(3);
		for (const row of stored)
			expect(created.invites.map((i) => i.token)).not.toContain(row.tokenHash);
	});

	it('lets the owner stay out of the game, but needs at least one player', async () => {
		const created = await start({ ownerPlays: false, seats: [{ name: 'Luca', role: 'player' }] });
		const owner = (await members(created.id)).find((r) => r.role === 'owner');
		expect(owner?.seat).toBeNull();
		expect((await members(created.id)).find((r) => r.displayName === 'Luca')?.seat).toBe(1);
		expect(
			await createRun(deps(), 'ana', {
				name: 'Senza',
				gameId: 'black',
				ownerPlays: false,
				seats: [{ name: 'Marta', role: 'spectator' }]
			})
		).toEqual({ ok: false, error: 'no_player' });
	});

	it('refuses repeated names and leaves nothing behind', async () => {
		const result = await createRun(deps(), 'ana', {
			name: 'Doppi',
			gameId: 'black',
			seats: [
				{ name: 'Luca', role: 'player' },
				{ name: 'luca', role: 'spectator' }
			]
		});
		expect(result).toMatchObject({ ok: false, error: 'validation' });
		expect(await connection.db.select().from(run)).toHaveLength(0);
	});
});

describe('run invitations', () => {
	it('creates an open link, lists it without the token, and revokes it', async () => {
		const created = await start();
		const result = await createRunInvite(deps(), created.id, 'ana', {
			role: 'spectator',
			maxUses: 3
		});
		expect(result.ok && result.invite.token.length).toBeGreaterThan(30);
		const [row] = await listRunInvites(deps(), created.id);
		expect(row).toMatchObject({
			role: 'spectator',
			seatName: null,
			uses: 0,
			maxUses: 3,
			status: 'valid'
		});
		expect(JSON.stringify(row)).not.toContain(result.ok ? result.invite.token : 'x');
		expect(await revokeRunInvite(deps(), created.id, row!.id)).toBe(true);
		expect((await listRunInvites(deps(), created.id))[0]!.status).toBe('revoked');
		expect(await revokeRunInvite(deps(), 'other-run', row!.id)).toBe(false);
	});

	it('reserves a seat when a name is given, and refuses a name already in use', async () => {
		const created = await start({ seats: [{ name: 'Luca', role: 'player' }] });
		const ok = await createRunInvite(deps(), created.id, 'ana', {
			role: 'player',
			seatName: 'Marta'
		});
		expect(ok.ok && ok.invite.memberId).toBeTruthy();
		expect((await members(created.id)).find((r) => r.displayName === 'Marta')?.seat).toBe(3);
		for (const seatName of ['luca', 'Ana']) {
			expect(
				await createRunInvite(deps(), created.id, 'ana', { role: 'player', seatName })
			).toMatchObject({ ok: false, error: 'validation' });
		}
	});

	it('refuses a role that is not player or spectator', async () => {
		const created = await start();
		expect(await createRunInvite(deps(), created.id, 'ana', { role: 'owner' })).toMatchObject({
			ok: false
		});
		expect(
			await createRunInvite(deps(), created.id, 'ana', { role: 'player', maxUses: 0 })
		).toMatchObject({
			ok: false
		});
	});

	it('shows the holder of a token the run, and nothing for a token that does not work', async () => {
		const created = await start({ seats: [{ name: 'Luca', role: 'player' }] });
		const token = created.invites[0]!.token;
		expect(await previewInvite(deps(), token)).toMatchObject({
			kind: 'run',
			runName: 'Gruppo',
			role: 'player',
			seatName: 'Luca',
			settings: { dupesClause: true },
			members: [
				{ name: 'ANA', role: 'owner', pending: false },
				{ name: 'Luca', role: 'player', pending: true }
			]
		});
		expect(await previewInvite(deps(), 'garbage')).toBeNull();
		clock += 8 * 24 * 60 * 60 * 1000;
		expect(await previewInvite(deps(), token)).toBeNull();
	});
});

describe('acceptInvite and declineInvite', () => {
	it('gives a reserved seat to the person who accepts, with the same member row', async () => {
		const created = await start({ seats: [{ name: 'Luca', role: 'player' }] });
		const seat = (await members(created.id)).find((r) => r.displayName === 'Luca')!;
		const result = await acceptInvite(deps(), 'ben', created.invites[0]!.token);
		expect(result).toEqual({ ok: true, runId: created.id, role: 'player' });
		const after = (await members(created.id)).find((r) => r.id === seat.id)!;
		expect(after).toMatchObject({ userId: 'ben', displayName: null, role: 'player', seat: 2 });
		expect(events.map((e) => e.type)).toContain('member.joined');
		expect((await getRun(connection.db, 'ben', created.id))?.context.memberRole).toBe('player');
		expect(await acceptInvite(deps(), 'cleo', created.invites[0]!.token)).toEqual({
			ok: false,
			error: 'invite_invalid'
		});
	});

	it('adds a new member from an open link, on the first free seat; a spectator takes none', async () => {
		const created = await start();
		const player = await createRunInvite(deps(), created.id, 'ana', { role: 'player', maxUses: 5 });
		const spectator = await createRunInvite(deps(), created.id, 'ana', { role: 'spectator' });
		if (!player.ok || !spectator.ok) throw new Error('invites');
		await acceptInvite(deps(), 'ben', player.invite.token);
		await acceptInvite(deps(), 'cleo', player.invite.token);
		await acceptInvite(deps(), 'dina', spectator.invite.token);
		const rows = await members(created.id);
		expect(rows.find((r) => r.userId === 'ben')).toMatchObject({ role: 'player', seat: 2 });
		expect(rows.find((r) => r.userId === 'cleo')).toMatchObject({ role: 'player', seat: 3 });
		expect(rows.find((r) => r.userId === 'dina')).toMatchObject({ role: 'spectator', seat: null });
	});

	it('refuses someone who is already a member, without using the invitation', async () => {
		const created = await start();
		const open = await createRunInvite(deps(), created.id, 'ana', { role: 'player', maxUses: 2 });
		if (!open.ok) throw new Error('invite');
		expect(await acceptInvite(deps(), 'ana', open.invite.token)).toEqual({
			ok: false,
			error: 'already_member'
		});
		expect((await listRunInvites(deps(), created.id))[0]!.uses).toBe(0);
	});

	it('lets only the first of two people win a single-use link', async () => {
		const created = await start();
		const open = await createRunInvite(deps(), created.id, 'ana', { role: 'player' });
		if (!open.ok) throw new Error('invite');
		const [a, b] = await Promise.all([
			acceptInvite(deps(), 'ben', open.invite.token),
			acceptInvite(deps(), 'cleo', open.invite.token)
		]);
		expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
		expect((await members(created.id)).filter((r) => r.role === 'player')).toHaveLength(1);
		expect((await listRunInvites(deps(), created.id))[0]!.uses).toBe(1);
	});

	it('refuses expired and revoked invitations, and a run that is over', async () => {
		const created = await start();
		const a = await createRunInvite(deps(), created.id, 'ana', {
			role: 'player',
			expiresInDays: 1
		});
		const b = await createRunInvite(deps(), created.id, 'ana', { role: 'player' });
		if (!a.ok || !b.ok) throw new Error('invites');
		await revokeRunInvite(deps(), created.id, b.invite.id);
		expect(await acceptInvite(deps(), 'ben', b.invite.token)).toMatchObject({
			error: 'invite_invalid'
		});
		await connection.db.update(run).set({ status: 'lost' }).where(eq(run.id, created.id));
		expect(await acceptInvite(deps(), 'ben', a.invite.token)).toEqual({
			ok: false,
			error: 'run_not_active'
		});
		await connection.db.update(run).set({ status: 'active' }).where(eq(run.id, created.id));
		clock += 2 * 24 * 60 * 60 * 1000;
		expect(await acceptInvite(deps(), 'ben', a.invite.token)).toMatchObject({
			error: 'invite_invalid'
		});
	});

	it('does not accept an invitation to the app as an invitation to a run', async () => {
		const { createInvite } = await import('../auth/index');
		const token = await createInvite(
			connection.db,
			{ id: 'i1', createdBy: 'ana', kind: 'app' },
			clock
		);
		expect(await acceptInvite(deps(), 'ben', token)).toMatchObject({ error: 'invite_invalid' });
		expect(await previewInvite(deps(), token)).toEqual({ kind: 'app' });
	});

	it('declining a reserved seat revokes the invitation and keeps the seat pending', async () => {
		const created = await start({ seats: [{ name: 'Luca', role: 'player' }] });
		expect(await declineInvite(deps(), 'ben', created.invites[0]!.token)).toBe(true);
		expect((await listRunInvites(deps(), created.id))[0]!.status).toBe('revoked');
		expect((await members(created.id)).find((r) => r.displayName === 'Luca')?.userId).toBeNull();
		expect(events.map((e) => e.type)).toContain('member.declined');
		expect(await declineInvite(deps(), 'ben', created.invites[0]!.token)).toBe(false);
	});

	it('declining an open link leaves it for the others', async () => {
		const created = await start();
		const open = await createRunInvite(deps(), created.id, 'ana', { role: 'player', maxUses: 2 });
		if (!open.ok) throw new Error('invite');
		expect(await declineInvite(deps(), 'ben', open.invite.token)).toBe(true);
		expect((await listRunInvites(deps(), created.id))[0]!.status).toBe('valid');
	});
});

describe('changing and removing members', () => {
	const joined = async () => {
		const created = await start({
			seats: [
				{ name: 'Luca', role: 'player' },
				{ name: 'Marta', role: 'player' }
			]
		});
		await acceptInvite(deps(), 'ben', created.invites[0]!.token);
		await acceptInvite(deps(), 'cleo', created.invites[1]!.token);
		const rows = await members(created.id);
		return {
			created,
			ben: rows.find((r) => r.userId === 'ben')!,
			cleo: rows.find((r) => r.userId === 'cleo')!,
			owner: rows.find((r) => r.userId === 'ana')!
		};
	};

	it('turns a player into a spectator and back, freeing and taking a seat', async () => {
		const { created, ben } = await joined();
		expect(await changeMember(deps(), created.id, 'ana', ben.id, { role: 'spectator' })).toEqual({
			ok: true
		});
		expect((await members(created.id)).find((r) => r.id === ben.id)).toMatchObject({
			role: 'spectator',
			seat: null
		});
		expect(disconnected).toContain('ben');
		expect(await changeMember(deps(), created.id, 'ana', ben.id, { role: 'player' })).toEqual({
			ok: true
		});
		expect((await members(created.id)).find((r) => r.id === ben.id)?.seat).toBe(2);
		expect(events.filter((e) => e.type === 'member.role_changed')).toHaveLength(2);
	});

	it('moves a player to a free seat only, and never changes the owner this way', async () => {
		const { created, ben, owner } = await joined();
		expect(await changeMember(deps(), created.id, 'ana', ben.id, { seat: 3 })).toEqual({
			ok: false,
			error: 'validation'
		});
		expect(await changeMember(deps(), created.id, 'ana', ben.id, { seat: 7 })).toEqual({
			ok: true
		});
		expect(await changeMember(deps(), created.id, 'ana', owner.id, { role: 'spectator' })).toEqual({
			ok: false,
			error: 'last_owner'
		});
		expect(await changeMember(deps(), created.id, 'ana', ben.id, {})).toMatchObject({ ok: false });
		expect(await changeMember(deps(), created.id, 'ana', 'nobody', { role: 'player' })).toEqual({
			ok: false,
			error: 'not_found'
		});
	});

	it('removes a member: they lose access, their row and data stay, the owner cannot be removed', async () => {
		const { created, ben, owner } = await joined();
		expect(await removeMember(deps(), created.id, 'ana', ben.id)).toEqual({ ok: true });
		const row = (await members(created.id)).find((r) => r.id === ben.id)!;
		expect(row).toMatchObject({ userId: 'ben', role: 'spectator', seat: null });
		expect(row.removedAt).toBe(clock);
		expect(await getRun(connection.db, 'ben', created.id)).toBeNull();
		expect(await runMemberAccess(connection.db).canStream('ben', created.id)).toBe(false);
		expect(await runMemberAccess(connection.db).canStream('cleo', created.id)).toBe(true);
		expect(disconnected).toContain('ben');
		expect(events.map((e) => e.type)).toContain('member.removed');
		expect(await removeMember(deps(), created.id, 'ana', owner.id)).toEqual({
			ok: false,
			error: 'last_owner'
		});
		expect(await removeMember(deps(), created.id, 'ana', ben.id)).toEqual({
			ok: false,
			error: 'not_found'
		});
	});

	it('does not count a removed player when listing runs or players', async () => {
		const { created, ben } = await joined();
		await removeMember(deps(), created.id, 'ana', ben.id);
		const { listRuns } = await import('./index');
		expect(await listRuns(connection.db, 'ben')).toEqual([]);
		expect((await listRuns(connection.db, 'ana'))[0]!.players).toBe(2);
	});

	it('brings a removed person back to their old row, with their data, when invited again', async () => {
		const { created, ben } = await joined();
		await removeMember(deps(), created.id, 'ana', ben.id);
		const again = await createRunInvite(deps(), created.id, 'ana', { role: 'player' });
		if (!again.ok) throw new Error('invite');
		expect(await acceptInvite(deps(), 'ben', again.invite.token)).toMatchObject({ ok: true });
		const rows = (await members(created.id)).filter((r) => r.userId === 'ben');
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ id: ben.id, role: 'player', removedAt: null });
	});

	it('revokes the invitation of a removed pending seat', async () => {
		const created = await start({ seats: [{ name: 'Luca', role: 'player' }] });
		const seat = (await members(created.id)).find((r) => r.displayName === 'Luca')!;
		await removeMember(deps(), created.id, 'ana', seat.id);
		expect(await acceptInvite(deps(), 'ben', created.invites[0]!.token)).toMatchObject({
			error: 'invite_invalid'
		});
	});

	it('hands the run to another player, who must be a real player', async () => {
		const { created, ben, owner } = await joined();
		const pending = await createRunInvite(deps(), created.id, 'ana', {
			role: 'player',
			seatName: 'Pia'
		});
		const pendingId = pending.ok ? pending.invite.memberId! : '';
		expect(await transferOwnership(deps(), created.id, 'ana', pendingId)).toEqual({
			ok: false,
			error: 'last_owner'
		});
		expect(await transferOwnership(deps(), created.id, 'ana', ben.id)).toEqual({ ok: true });
		const rows = await members(created.id);
		expect(rows.find((r) => r.id === ben.id)?.role).toBe('owner');
		expect(rows.find((r) => r.id === owner.id)).toMatchObject({ role: 'player', seat: 1 });
		const [saved] = await connection.db.select().from(run).where(eq(run.id, created.id));
		expect(saved!.ownerId).toBe('ben');
		expect(events.map((e) => e.type)).toContain('run.owner_changed');
	});
});

describe('permissions on a run', () => {
	it('lets a spectator read but not invite, change or remove anyone (checked on the server)', async () => {
		const created = await start({ seats: [{ name: 'Marta', role: 'spectator' }] });
		await acceptInvite(deps(), 'ben', created.invites[0]!.token);
		for (const action of [
			'run.invite',
			'run.members.update',
			'run.members.remove',
			'run.transfer'
		] as const) {
			expect(await requireRun(connection.db, actor('ben'), created.id, action)).toEqual({
				ok: false,
				reason: 'forbidden'
			});
		}
		expect(await requireRun(connection.db, actor('ben'), created.id, 'run.read')).toMatchObject({
			ok: true,
			role: 'spectator'
		});
		expect(await requireRun(connection.db, actor('ben'), created.id, 'run.leave')).toMatchObject({
			ok: true
		});
	});

	it('lets a player read but not manage; the owner may; a stranger sees nothing', async () => {
		const created = await start({ seats: [{ name: 'Luca', role: 'player' }] });
		await acceptInvite(deps(), 'ben', created.invites[0]!.token);
		expect(await requireRun(connection.db, actor('ben'), created.id, 'run.invite')).toMatchObject({
			ok: false,
			reason: 'forbidden'
		});
		expect(await requireRun(connection.db, actor('ana'), created.id, 'run.invite')).toMatchObject({
			ok: true
		});
		expect(await requireRun(connection.db, actor('cleo'), created.id, 'run.read')).toEqual({
			ok: false,
			reason: 'not_found'
		});
		expect(await requireRun(connection.db, null, created.id, 'run.read')).toEqual({
			ok: false,
			reason: 'unauthenticated'
		});
	});

	it('refuses changes on a run that is over', async () => {
		const created = await start();
		await connection.db.update(run).set({ status: 'completed' }).where(eq(run.id, created.id));
		expect(await requireRun(connection.db, actor('ana'), created.id, 'run.invite')).toEqual({
			ok: false,
			reason: 'run_not_active'
		});
	});
});

describe('handOverRuns', () => {
	const setup = async () => {
		const created = await start({
			seats: [
				{ name: 'Luca', role: 'player' },
				{ name: 'Marta', role: 'player' },
				{ name: 'Spett', role: 'spectator' }
			]
		});
		await acceptInvite(deps(), 'ben', created.invites[0]!.token);
		await acceptInvite(deps(), 'cleo', created.invites[1]!.token);
		await acceptInvite(deps(), 'dina', created.invites[2]!.token);
		return created;
	};
	const hand = (userId: string) =>
		connection.db.transaction((tx) => handOverRuns(tx, userId, clock));

	it('passes the run to the player with the next seat and stops the old owner playing', async () => {
		const created = await setup();
		expect(await hand('ana')).toEqual([{ runId: created.id, from: 'ana', to: 'ben' }]);
		const rows = await members(created.id);
		expect(rows.find((r) => r.userId === 'ben')?.role).toBe('owner');
		expect(rows.find((r) => r.userId === 'ana')).toMatchObject({ role: 'spectator', seat: null });
		const [saved] = await connection.db.select().from(run).where(eq(run.id, created.id));
		expect(saved!.ownerId).toBe('ben');
	});

	it('skips accounts that are already deleted and spectators', async () => {
		const created = await setup();
		await connection.db
			.update(user)
			.set({ deletedAt: new Date(1) })
			.where(eq(user.id, 'ben'));
		expect(await hand('ana')).toEqual([{ runId: created.id, from: 'ana', to: 'cleo' }]);
	});

	it('keeps the run with its owner when nobody can take over, and stops a deleted player', async () => {
		const solo = await start();
		expect(await hand('ana')).toEqual([]);
		expect((await members(solo.id)).find((r) => r.userId === 'ana')?.role).toBe('owner');
		const group = await setup();
		await hand('ben');
		expect((await members(group.id)).find((r) => r.userId === 'ben')).toMatchObject({
			role: 'spectator',
			seat: null
		});
	});
});
