import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { registerUser } from './application/register';
import { createAuth, type Auth } from './infrastructure/better-auth';
import { createInvite, setRegistrationMode } from './infrastructure/invites';
import { loadAuthSecret } from './infrastructure/secret';
import { account, invite } from './infrastructure/schema';

let dir: string;
let connection: Connection;
let auth: Auth;
const now = 1_790_000_000_000;
const person = { name: 'Luca', email: 'luca@example.test', password: 'password-lunga-1' };

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-auth-'));
	const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
	await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	await connection.db.insert((await import('./infrastructure/schema')).user).values({
		id: 'admin',
		name: 'Admin',
		email: 'admin@example.test',
		createdAt: new Date(now),
		updatedAt: new Date(now)
	});
	auth = createAuth({ db: connection.db, secret: 'a-test-secret-with-more-than-32-characters' });
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

const deps = () => ({ db: connection.db, auth, now: () => now });
const makeInvite = (over: Partial<Parameters<typeof createInvite>[1]> = {}) =>
	createInvite(
		connection.db,
		{ id: crypto.randomUUID(), createdBy: 'admin', kind: 'app', ...over },
		now
	);

describe('registerUser', () => {
	it('requires an invitation by default', async () => {
		expect(await registerUser(deps(), person)).toEqual({ ok: false, error: 'invite_invalid' });
	});

	it('creates the account with a valid invitation and uses it once', async () => {
		const token = await makeInvite();
		const first = await registerUser(deps(), { ...person, inviteToken: token });
		expect(first.ok).toBe(true);
		const second = await registerUser(deps(), {
			...person,
			email: 'sara@example.test',
			inviteToken: token
		});
		expect(second).toEqual({ ok: false, error: 'invite_invalid' });
	});

	it('accepts an invitation to a run for registering as well', async () => {
		const token = await makeInvite({ kind: 'run', runId: 'run-1', role: 'player' });
		expect((await registerUser(deps(), { ...person, inviteToken: token })).ok).toBe(true);
	});

	it('refuses expired and revoked invitations', async () => {
		const expired = await makeInvite({ ttlMs: -1 });
		expect(await registerUser(deps(), { ...person, inviteToken: expired })).toEqual({
			ok: false,
			error: 'invite_invalid'
		});
		const revoked = await makeInvite();
		await connection.db.update(invite).set({ revokedAt: now });
		expect(await registerUser(deps(), { ...person, inviteToken: revoked })).toEqual({
			ok: false,
			error: 'invite_invalid'
		});
	});

	it('gives the invitation back when the account cannot be created', async () => {
		const token = await makeInvite();
		expect((await registerUser(deps(), { ...person, inviteToken: token })).ok).toBe(true);
		const again = await makeInvite({ maxUses: 1 });
		const duplicate = await registerUser(deps(), { ...person, inviteToken: again });
		expect(duplicate).toEqual({ ok: false, error: 'email_taken' });
		// The invitation was not burnt: someone else can still use it.
		const other = await registerUser(deps(), {
			...person,
			email: 'sara@example.test',
			inviteToken: again
		});
		expect(other.ok).toBe(true);
	});

	it('lets anyone in when registration is open', async () => {
		await setRegistrationMode(connection.db, 'open', now);
		expect((await registerUser(deps(), person)).ok).toBe(true);
	});

	it('refuses everyone when registration is closed, even with an invitation', async () => {
		await setRegistrationMode(connection.db, 'closed', now);
		const token = await makeInvite();
		expect(await registerUser(deps(), { ...person, inviteToken: token })).toEqual({
			ok: false,
			error: 'registration_closed'
		});
	});

	it('rejects a short password', async () => {
		await setRegistrationMode(connection.db, 'open', now);
		expect(await registerUser(deps(), { ...person, password: 'short' })).toEqual({
			ok: false,
			error: 'validation'
		});
	});
});

describe('public sign-up', () => {
	it('is not reachable over HTTP, whatever the registration mode', async () => {
		await setRegistrationMode(connection.db, 'open', now);
		const response = await auth.handler(
			new Request('http://localhost/api/auth/sign-up/email', {
				method: 'POST',
				headers: { 'content-type': 'application/json', origin: 'http://localhost' },
				body: JSON.stringify(person)
			})
		);
		expect(response.status).toBe(404);
	});
});

describe('login', () => {
	beforeEach(async () => {
		await setRegistrationMode(connection.db, 'open', now);
		await registerUser(deps(), person);
	});

	const signIn = (password: string, ip = '10.0.0.1') =>
		auth.handler(
			new Request('http://localhost/api/auth/sign-in/email', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					origin: 'http://localhost',
					'x-forwarded-for': ip
				},
				body: JSON.stringify({ email: person.email, password })
			})
		);

	it('accepts the right password and returns a session cookie that expires', async () => {
		const response = await signIn(person.password);
		expect(response.status).toBe(200);
		const cookie = response.headers.get('set-cookie') ?? '';
		expect(cookie).toMatch(/session_token/);
		expect(cookie).toMatch(/Max-Age=604800/i);
		expect(cookie).toMatch(/HttpOnly/i);
	});

	it('rejects a wrong password with the same answer as an unknown user', async () => {
		const wrong = await signIn('wrong-password-1');
		expect(wrong.status).toBe(401);
		const unknown = await auth.handler(
			new Request('http://localhost/api/auth/sign-in/email', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					origin: 'http://localhost',
					'x-forwarded-for': '10.0.0.9'
				},
				body: JSON.stringify({ email: 'nobody@example.test', password: 'wrong-password-1' })
			})
		);
		expect(unknown.status).toBe(401);
		expect(await wrong.json()).toEqual(await unknown.json());
	});

	it('limits repeated attempts', async () => {
		const statuses: number[] = [];
		for (let i = 0; i < 7; i++)
			statuses.push((await signIn('wrong-password-1', '10.0.0.2')).status);
		expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
		expect(statuses.slice(5)).toEqual([429, 429]);
		// Another address is not affected.
		expect((await signIn(person.password, '10.0.0.3')).status).toBe(200);
	});

	it('stores only a hash of the password', async () => {
		const [row] = await connection.db
			.select()
			.from(account)
			.where(eq(account.providerId, 'credential'));
		expect(row?.password).toBeTruthy();
		expect(row?.password).not.toContain(person.password);
		expect(row?.password).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
	});
});

describe('loadAuthSecret', () => {
	it('uses the configured secret', () => {
		expect(loadAuthSecret('configured-secret-of-at-least-32-characters', dir)).toBe(
			'configured-secret-of-at-least-32-characters'
		);
	});

	it('generates one, keeps it for the next start, and protects the file', () => {
		const first = loadAuthSecret(undefined, dir);
		expect(first.length).toBeGreaterThanOrEqual(32);
		expect(loadAuthSecret(undefined, dir)).toBe(first);
		expect(statSync(join(dir, 'auth-secret')).mode & 0o077).toBe(0);
	});
});
