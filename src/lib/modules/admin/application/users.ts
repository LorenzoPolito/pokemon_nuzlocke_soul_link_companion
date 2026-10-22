import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import type { Auth } from '../../auth/infrastructure/better-auth';
import { account, invite, session, user } from '../../auth/infrastructure/schema';
import { leavesNoAdmin, type AccountSummary } from '../domain/last-admin';

export type AdminUserRow = {
	id: string;
	name: string;
	email: string;
	isAdmin: boolean;
	disabled: boolean;
	deleted: boolean;
	createdAt: number;
};

export type AdminError = 'not_found' | 'last_admin' | 'self' | 'deleted';
export type AdminResult = { ok: true } | { ok: false; error: AdminError };

type Deps = { db: Database; auth: Auth; headers: Headers };

const summaries = async (db: Database): Promise<AccountSummary[]> =>
	(await db.select({ id: user.id, role: user.role, banned: user.banned }).from(user)).map((u) => ({
		id: u.id,
		isAdmin: u.role === 'admin',
		disabled: u.banned === true
	}));

/** All accounts, anonymised ones included (they stay so that runs and the diary keep working). */
export async function listUsers(db: Database): Promise<AdminUserRow[]> {
	const rows = await db.select().from(user).orderBy(user.createdAt);
	return rows.map((u) => ({
		id: u.id,
		name: u.name,
		email: u.email,
		isAdmin: u.role === 'admin',
		disabled: u.banned === true,
		deleted: u.deletedAt !== null,
		createdAt: u.createdAt.getTime()
	}));
}

/** Guards shared by the changes that could remove the last administrator or lock the actor out. */
async function guard(
	deps: Deps,
	actorId: string,
	targetId: string,
	change: 'demote' | 'disable' | 'delete'
): Promise<AdminResult | null> {
	const [target] = await deps.db
		.select({ id: user.id, deletedAt: user.deletedAt })
		.from(user)
		.where(eq(user.id, targetId));
	if (!target) return { ok: false, error: 'not_found' };
	if (target.deletedAt) return { ok: false, error: 'deleted' };
	if (targetId === actorId && change !== 'demote') return { ok: false, error: 'self' };
	if (leavesNoAdmin(await summaries(deps.db), targetId)) return { ok: false, error: 'last_admin' };
	return null;
}

/** Disables an account: it cannot sign in and its sessions end. */
export async function disableUser(
	deps: Deps,
	actorId: string,
	targetId: string
): Promise<AdminResult> {
	const refused = await guard(deps, actorId, targetId, 'disable');
	if (refused) return refused;
	await deps.auth.api.banUser({
		body: { userId: targetId, banReason: 'disabled by an administrator' },
		headers: deps.headers
	});
	return { ok: true };
}

export async function enableUser(deps: Deps, targetId: string): Promise<AdminResult> {
	const [target] = await deps.db
		.select({ deletedAt: user.deletedAt })
		.from(user)
		.where(eq(user.id, targetId));
	if (!target) return { ok: false, error: 'not_found' };
	if (target.deletedAt) return { ok: false, error: 'deleted' };
	await deps.auth.api.unbanUser({ body: { userId: targetId }, headers: deps.headers });
	return { ok: true };
}

/** Makes an account an administrator, or takes the role away (never from the last one). */
export async function setAdmin(
	deps: Deps,
	actorId: string,
	targetId: string,
	makeAdmin: boolean
): Promise<AdminResult> {
	if (!makeAdmin) {
		const refused = await guard(deps, actorId, targetId, 'demote');
		if (refused) return refused;
	} else {
		const [target] = await deps.db
			.select({ deletedAt: user.deletedAt })
			.from(user)
			.where(eq(user.id, targetId));
		if (!target) return { ok: false, error: 'not_found' };
		if (target.deletedAt) return { ok: false, error: 'deleted' };
	}
	await deps.auth.api.setRole({
		body: { userId: targetId, role: makeAdmin ? 'admin' : 'user' },
		headers: deps.headers
	});
	return { ok: true };
}

/**
 * Sets a temporary password for an account: the person must choose their own at the next
 * sign-in, and the sessions they had end.
 */
export async function resetPassword(
	deps: Deps,
	targetId: string,
	temporaryPassword: string
): Promise<AdminResult> {
	const [target] = await deps.db
		.select({ deletedAt: user.deletedAt })
		.from(user)
		.where(eq(user.id, targetId));
	if (!target) return { ok: false, error: 'not_found' };
	if (target.deletedAt) return { ok: false, error: 'deleted' };
	await deps.auth.api.setUserPassword({
		body: { userId: targetId, newPassword: temporaryPassword },
		headers: deps.headers
	});
	await deps.db.update(user).set({ mustChangePassword: true }).where(eq(user.id, targetId));
	await deps.auth.api.revokeUserSessions({ body: { userId: targetId }, headers: deps.headers });
	return { ok: true };
}

/**
 * Deletes an account by anonymising it (docs/progetto/06): the row stays so that the runs and
 * the diary that point to it remain valid, but name, email and credentials go away.
 */
export async function deleteUser(
	deps: Deps,
	actorId: string,
	targetId: string,
	now: number
): Promise<AdminResult> {
	const refused = await guard(deps, actorId, targetId, 'delete');
	if (refused) return refused;
	await deps.db.transaction(async (tx) => {
		await tx
			.update(user)
			.set({
				name: 'Utente eliminato',
				email: `deleted-${targetId}@invalid`,
				image: null,
				banned: true,
				role: 'user',
				locale: null,
				theme: null,
				deletedAt: new Date(now),
				updatedAt: new Date(now)
			})
			.where(eq(user.id, targetId));
		await tx.delete(account).where(eq(account.userId, targetId));
		await tx.delete(session).where(eq(session.userId, targetId));
	});
	return { ok: true };
}

export type InviteRow = {
	id: string;
	uses: number;
	maxUses: number;
	expiresAt: number;
	revoked: boolean;
};

/** The latest invitations to the app, newest first. */
export async function listAppInvites(db: Database, limit = 10): Promise<InviteRow[]> {
	const rows = await db
		.select()
		.from(invite)
		.where(eq(invite.kind, 'app'))
		.orderBy(desc(invite.createdAt))
		.limit(limit);
	return rows.map((r) => ({
		id: r.id,
		uses: r.uses,
		maxUses: r.maxUses,
		expiresAt: r.expiresAt,
		revoked: r.revokedAt !== null
	}));
}

export async function revokeInvite(db: Database, id: string, now: number): Promise<boolean> {
	const updated = await db
		.update(invite)
		.set({ revokedAt: now })
		.where(and(eq(invite.id, id), eq(invite.kind, 'app')))
		.returning({ id: invite.id });
	return updated.length === 1;
}
