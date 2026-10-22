import { eq } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import type { Auth } from '../infrastructure/better-auth';
import { user } from '../infrastructure/schema';

/** Thrown when the first administrator cannot be created; the app must not start. */
export class AdminSetupError extends Error {
	override name = 'AdminSetupError';
}

export type AdminCredentials = { email?: string; password?: string };

export type EnsureAdminResult = 'exists' | 'created' | 'promoted';

/**
 * Makes sure the app has an administrator.
 *
 * - An admin already exists: nothing happens (and nothing is read from the variables).
 * - Otherwise `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required; without them the app stops.
 * - The account is looked up **by email**, so a previous start that stopped between creating
 *   the account and giving it the role is completed instead of repeated.
 * - A new admin must change the password at the first sign-in.
 */
export async function ensureAdmin(
	deps: { db: Database; auth: Auth },
	credentials: AdminCredentials
): Promise<EnsureAdminResult> {
	const { db, auth } = deps;
	const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, 'admin')).limit(1);
	if (admins.length > 0) return 'exists';

	const email = credentials.email?.trim().toLowerCase();
	const { password } = credentials;
	if (!email || !password) {
		throw new AdminSetupError(
			'There is no administrator yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one at startup.'
		);
	}
	if (password.length < 8) {
		throw new AdminSetupError('ADMIN_PASSWORD must be at least 8 characters.');
	}

	const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
	if (existing) {
		// A previous start created the account but stopped before giving it the role.
		await db.update(user).set({ role: 'admin' }).where(eq(user.id, existing.id));
		return 'promoted';
	}

	const created = await auth.api.signUpEmail({ body: { name: 'Admin', email, password } });
	await db
		.update(user)
		.set({ role: 'admin', mustChangePassword: true })
		.where(eq(user.id, created.user.id));
	return 'created';
}
