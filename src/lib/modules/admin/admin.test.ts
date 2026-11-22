import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { ensureAdmin } from '../auth/application/ensure-admin';
import { registerUser } from '../auth/application/register';
import { createAuth, type Auth } from '../auth/infrastructure/better-auth';
import { createInvite, setRegistrationMode } from '../auth/infrastructure/invites';
import { account, session, user } from '../auth/infrastructure/schema';
import { acceptInvite, createRun } from '../runs/index';
import { run, runMember } from '../runs/infrastructure/schema';
import {
	deleteUser,
	disableUser,
	enableUser,
	listAppInvites,
	listUsers,
	resetPassword,
	revokeInvite,
	setAdmin
} from './application/users';

let dir: string;
let connection: Connection;
let auth: Auth;
let adminId: string;
let adminHeaders: Headers;
const now = 1_790_000_000_000;

const deps = () => ({ db: connection.db, auth, headers: adminHeaders });
const find = async (email: string) =>
	(await connection.db.select().from(user).where(eq(user.email, email)))[0];
const signIn = (email: string, password: string) =>
	auth.api.signInEmail({ body: { email, password }, returnHeaders: true });

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-admin-panel-'));
	const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
	await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	auth = createAuth({ db: connection.db, secret: 'a-test-secret-with-more-than-32-characters' });
	await ensureAdmin(
		{ db: connection.db, auth },
		{ email: 'admin@example.test', password: 'password-iniziale-1' }
	);
	adminId = (await find('admin@example.test'))!.id;
	const login = await signIn('admin@example.test', 'password-iniziale-1');
	adminHeaders = new Headers({
		cookie: login.headers
			.getSetCookie()
			.map((c) => c.split(';')[0])
			.join('; ')
	});
	await setRegistrationMode(connection.db, 'open', now);
	await registerUser(
		{ db: connection.db, auth, now: () => now },
		{ name: 'Sara', email: 'sara@example.test', password: 'password-lunga-1' }
	);
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

const sara = async () => (await find('sara@example.test'))!;

describe('listUsers', () => {
	it('lists every account with its role and state', async () => {
		const rows = await listUsers(connection.db);
		expect(rows.map((r) => [r.email, r.isAdmin, r.disabled, r.deleted])).toEqual([
			['admin@example.test', true, false, false],
			['sara@example.test', false, false, false]
		]);
	});
});

describe('disable and enable', () => {
	it('stops the account from signing in, and enabling lets it back', async () => {
		await disableUser(deps(), adminId, (await sara()).id);
		await expect(signIn('sara@example.test', 'password-lunga-1')).rejects.toThrow();
		await enableUser(deps(), (await sara()).id);
		expect((await signIn('sara@example.test', 'password-lunga-1')).response.user.email).toBe(
			'sara@example.test'
		);
	});

	it('ends the sessions the account already had', async () => {
		await signIn('sara@example.test', 'password-lunga-1');
		expect(
			await connection.db
				.select()
				.from(session)
				.where(eq(session.userId, (await sara()).id))
		).not.toHaveLength(0);
		await disableUser(deps(), adminId, (await sara()).id);
		expect(
			await connection.db
				.select()
				.from(session)
				.where(eq(session.userId, (await sara()).id))
		).toHaveLength(0);
	});

	it('refuses to disable the actor or the last administrator', async () => {
		expect(await disableUser(deps(), adminId, adminId)).toEqual({ ok: false, error: 'self' });
		// Only one active administrator: another actor still may not disable it.
		expect(await disableUser(deps(), 'someone-else', adminId)).toEqual({
			ok: false,
			error: 'last_admin'
		});
		// With a second active administrator, the other one can be disabled.
		await setAdmin(deps(), adminId, (await sara()).id, true);
		expect(await disableUser(deps(), adminId, (await sara()).id)).toEqual({ ok: true });
		// ...and then the first is the last one again.
		expect(await disableUser(deps(), 'someone-else', adminId)).toEqual({
			ok: false,
			error: 'last_admin'
		});
	});
});

describe('roles', () => {
	it('promotes and demotes, but never the last administrator', async () => {
		expect(await setAdmin(deps(), adminId, (await sara()).id, true)).toEqual({ ok: true });
		expect((await sara()).role).toBe('admin');
		expect(await setAdmin(deps(), adminId, adminId, false)).toEqual({ ok: true });
		expect(await setAdmin(deps(), adminId, (await sara()).id, false)).toEqual({
			ok: false,
			error: 'last_admin'
		});
	});
});

describe('resetPassword', () => {
	it('sets a temporary password that must be changed, and ends the old sessions', async () => {
		await signIn('sara@example.test', 'password-lunga-1');
		await resetPassword(deps(), (await sara()).id, 'temporanea-12345');
		await expect(signIn('sara@example.test', 'password-lunga-1')).rejects.toThrow();
		expect((await signIn('sara@example.test', 'temporanea-12345')).response.user.email).toBe(
			'sara@example.test'
		);
		expect((await sara()).mustChangePassword).toBe(true);
		expect(
			await connection.db
				.select()
				.from(session)
				.where(eq(session.userId, (await sara()).id))
		).toHaveLength(1);
	});
});

describe('registering with an invitation to a run', () => {
	it('lets a newcomer register without using up the invitation, which they then accept', async () => {
		await setRegistrationMode(connection.db, 'invite', now);
		const created = await createRun({ db: connection.db, now: () => now }, adminId, {
			name: 'Aperta',
			gameId: 'black',
			seats: [{ name: 'Nuovo', role: 'player' }]
		});
		if (!created.ok) throw new Error(created.error);
		const token = created.run.invites[0]!.token;
		const result = await registerUser(
			{ db: connection.db, auth, now: () => now },
			{
				name: 'Nuovo',
				email: 'nuovo@example.test',
				password: 'password-lunga-1',
				inviteToken: token
			}
		);
		expect(result.ok).toBe(true);
		const newcomer = (await find('nuovo@example.test'))!.id;
		expect(
			await acceptInvite({ db: connection.db, now: () => now }, newcomer, token)
		).toMatchObject({ ok: true, role: 'player' });
		// A token that does not work still does not let anyone register.
		const bad = await registerUser(
			{ db: connection.db, auth, now: () => now },
			{ name: 'X', email: 'x@example.test', password: 'password-lunga-1', inviteToken: token }
		);
		expect(bad).toEqual({ ok: false, error: 'invite_invalid' });
	});
});

describe('deleteUser and the runs of the account', () => {
	const people = async () => {
		await registerUser(
			{ db: connection.db, auth, now: () => now },
			{ name: 'Tom', email: 'tom@example.test', password: 'password-lunga-1' }
		);
		return { sara: (await sara()).id, tom: (await find('tom@example.test'))!.id };
	};
	const events: { type: string; runId: string }[] = [];

	it('passes its runs to the player with the next seat and stops it playing elsewhere', async () => {
		const { sara: saraId, tom } = await people();
		const owned = await createRun({ db: connection.db }, saraId, {
			name: 'Di Sara',
			gameId: 'black',
			seats: [{ name: 'Tom', role: 'player' }]
		});
		if (!owned.ok) throw new Error(owned.error);
		await acceptInvite({ db: connection.db }, tom, owned.run.invites[0]!.token);
		const other = await createRun({ db: connection.db }, adminId, {
			name: 'Del admin',
			gameId: 'white',
			seats: [{ name: 'Sara', role: 'player' }]
		});
		if (!other.ok) throw new Error(other.error);
		await acceptInvite({ db: connection.db }, saraId, other.run.invites[0]!.token);

		const result = await deleteUser(
			{
				...deps(),
				publish: async (e) => {
					events.push(e);
				}
			},
			adminId,
			saraId,
			now
		);
		expect(result).toEqual({ ok: true });

		const rows = await connection.db.select().from(runMember);
		const of = (runId: string, userId: string) =>
			rows.find((r) => r.runId === runId && r.userId === userId);
		expect(of(owned.run.id, tom)?.role).toBe('owner');
		expect(of(owned.run.id, saraId)).toMatchObject({ role: 'spectator', seat: null });
		expect(of(other.run.id, saraId)).toMatchObject({ role: 'spectator', seat: null });
		expect(of(other.run.id, adminId)?.role).toBe('owner');
		const [saved] = await connection.db.select().from(run).where(eq(run.id, owned.run.id));
		expect(saved!.ownerId).toBe(tom);
		expect(events).toEqual([
			expect.objectContaining({ type: 'run.owner_changed', runId: owned.run.id })
		]);
	});

	it('keeps a run with its anonymised owner when nobody else can take over', async () => {
		const { sara: saraId } = await people();
		const solo = await createRun({ db: connection.db }, saraId, { name: 'Sola', gameId: 'black' });
		if (!solo.ok) throw new Error(solo.error);
		await deleteUser(deps(), adminId, saraId, now);
		const [saved] = await connection.db.select().from(run).where(eq(run.id, solo.run.id));
		expect(saved!.ownerId).toBe(saraId);
		const [row] = await connection.db
			.select()
			.from(runMember)
			.where(eq(runMember.runId, solo.run.id));
		expect(row?.role).toBe('owner');
	});
});

describe('deleteUser (anonymise)', () => {
	it('keeps the row, removes name, email and credentials, and ends sessions', async () => {
		const id = (await sara()).id;
		await signIn('sara@example.test', 'password-lunga-1');
		expect(await deleteUser(deps(), adminId, id, now)).toEqual({ ok: true });
		const [row] = await connection.db.select().from(user).where(eq(user.id, id));
		expect(row).toMatchObject({
			name: 'Utente eliminato',
			email: `deleted-${id}@invalid`,
			banned: true,
			role: 'user'
		});
		expect(row?.deletedAt?.getTime()).toBe(now);
		expect(await connection.db.select().from(account).where(eq(account.userId, id))).toHaveLength(
			0
		);
		expect(await connection.db.select().from(session).where(eq(session.userId, id))).toHaveLength(
			0
		);
		await expect(signIn('sara@example.test', 'password-lunga-1')).rejects.toThrow();
	});

	it('frees the email for a new account', async () => {
		await deleteUser(deps(), adminId, (await sara()).id, now);
		const again = await registerUser(
			{ db: connection.db, auth, now: () => now },
			{ name: 'Sara', email: 'sara@example.test', password: 'password-lunga-1' }
		);
		expect(again.ok).toBe(true);
	});

	it('refuses the actor, the last administrator and an account already deleted', async () => {
		expect(await deleteUser(deps(), adminId, adminId, now)).toEqual({ ok: false, error: 'self' });
		const id = (await sara()).id;
		await deleteUser(deps(), adminId, id, now);
		expect(await deleteUser(deps(), adminId, id, now)).toEqual({ ok: false, error: 'deleted' });
		expect(await deleteUser(deps(), adminId, 'nobody', now)).toEqual({
			ok: false,
			error: 'not_found'
		});
		expect(await resetPassword(deps(), id, 'temporanea-12345')).toEqual({
			ok: false,
			error: 'deleted'
		});
		expect(await enableUser(deps(), id)).toEqual({ ok: false, error: 'deleted' });
	});
});

describe('invitations', () => {
	it('lists the latest app invitations and revokes one', async () => {
		await createInvite(
			connection.db,
			{ id: 'i1', createdBy: adminId, kind: 'app', maxUses: 3 },
			now
		);
		await createInvite(
			connection.db,
			{ id: 'i2', createdBy: adminId, kind: 'run', runId: 'r', role: 'player' },
			now + 1
		);
		const list = await listAppInvites(connection.db);
		expect(list).toEqual([
			{ id: 'i1', uses: 0, maxUses: 3, expiresAt: now + 7 * 24 * 3600 * 1000, revoked: false }
		]);
		expect(await revokeInvite(connection.db, 'i1', now)).toBe(true);
		expect((await listAppInvites(connection.db))[0]?.revoked).toBe(true);
		expect(await revokeInvite(connection.db, 'i2', now)).toBe(false); // run invitations are not managed here
	});
});
