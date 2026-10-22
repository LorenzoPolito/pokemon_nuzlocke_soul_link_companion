import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseConfig } from '../../server/config';
import { openDatabase, type Connection } from '../../server/database/client';
import { runMigrations } from '../../server/database/migrate';
import { AdminSetupError, ensureAdmin } from './application/ensure-admin';
import { createAuth, type Auth } from './infrastructure/better-auth';
import { user } from './infrastructure/schema';

let dir: string;
let connection: Connection;
let auth: Auth;
const credentials = { email: 'Admin@Example.test', password: 'password-iniziale-1' };

beforeEach(async () => {
	dir = mkdtempSync(join(tmpdir(), 'nsl-admin-'));
	const config: DatabaseConfig = { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir };
	connection = await openDatabase(config);
	await runMigrations(connection, config, join(process.cwd(), 'drizzle'));
	auth = createAuth({ db: connection.db, secret: 'a-test-secret-with-more-than-32-characters' });
});

afterEach(() => {
	connection.client.close();
	rmSync(dir, { recursive: true, force: true });
});

const deps = () => ({ db: connection.db, auth });
const users = () => connection.db.select().from(user);

describe('ensureAdmin', () => {
	it('creates the admin once, with a pending password change', async () => {
		expect(await ensureAdmin(deps(), credentials)).toBe('created');
		const [admin, ...others] = await users();
		expect(others).toEqual([]);
		expect(admin).toMatchObject({
			email: 'admin@example.test',
			role: 'admin',
			mustChangePassword: true
		});
	});

	it('does not create a second one at the next start, and needs no variables then', async () => {
		await ensureAdmin(deps(), credentials);
		expect(await ensureAdmin(deps(), credentials)).toBe('exists');
		expect(await ensureAdmin(deps(), {})).toBe('exists');
		expect(await users()).toHaveLength(1);
	});

	it('stops with a clear message when there is no admin and no variables', async () => {
		await expect(ensureAdmin(deps(), {})).rejects.toThrow(AdminSetupError);
		await expect(ensureAdmin(deps(), { email: 'a@example.test' })).rejects.toThrow(
			/ADMIN_EMAIL and ADMIN_PASSWORD/
		);
	});

	it('rejects a short password', async () => {
		await expect(ensureAdmin(deps(), { ...credentials, password: 'short' })).rejects.toThrow(
			/at least 8/
		);
	});

	it('completes a start that stopped before the role was set', async () => {
		// The account exists (registration done) but has no role: the previous start crashed.
		await auth.api.signUpEmail({
			body: { name: 'Admin', email: 'admin@example.test', password: credentials.password }
		});
		expect(await ensureAdmin(deps(), credentials)).toBe('promoted');
		expect(await users()).toHaveLength(1);
		expect((await users())[0]?.role).toBe('admin');
	});
});

describe('forced password change', () => {
	const signIn = (password: string) =>
		auth.api.signInEmail({ body: { email: 'admin@example.test', password }, returnHeaders: true });

	beforeEach(async () => {
		await ensureAdmin(deps(), credentials);
	});

	const cookieOf = (headers: Headers) =>
		headers
			.getSetCookie()
			.map((c) => c.split(';')[0])
			.join('; ');

	it('signs in with the initial password, flagged', async () => {
		const { response } = await signIn(credentials.password);
		expect(response.user).toMatchObject({ email: 'admin@example.test' });
		const session = await auth.api.getSession({
			headers: new Headers({ cookie: cookieOf((await signIn(credentials.password)).headers) })
		});
		expect((session?.user as Record<string, unknown>).mustChangePassword).toBe(true);
	});

	it('clears the flag when the password is changed, and the old password stops working', async () => {
		const login = await signIn(credentials.password);
		const headers = new Headers({ cookie: cookieOf(login.headers) });
		await auth.api.changePassword({
			body: {
				currentPassword: credentials.password,
				newPassword: 'nuova-password-9',
				revokeOtherSessions: true
			},
			headers
		});
		const [admin] = await connection.db
			.select()
			.from(user)
			.where(eq(user.email, 'admin@example.test'));
		expect(admin?.mustChangePassword).toBe(false);
		await expect(signIn(credentials.password)).rejects.toThrow();
		expect((await signIn('nuova-password-9')).response.user.email).toBe('admin@example.test');
	});

	it('keeps the flag when the change fails', async () => {
		const login = await signIn(credentials.password);
		const headers = new Headers({ cookie: cookieOf(login.headers) });
		await expect(
			auth.api.changePassword({
				body: { currentPassword: 'not-the-password', newPassword: 'nuova-password-9' },
				headers
			})
		).rejects.toThrow();
		const [admin] = await connection.db
			.select()
			.from(user)
			.where(eq(user.email, 'admin@example.test'));
		expect(admin?.mustChangePassword).toBe(true);
	});
});
