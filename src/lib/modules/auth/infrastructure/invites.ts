import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import { appSetting, invite } from './schema';
import {
	DEFAULT_REGISTRATION_MODE,
	isRegistrationMode,
	type RegistrationMode
} from '../domain/registration';

const REGISTRATION_KEY = 'registration.mode';

export const hashToken = (token: string): string =>
	createHash('sha256').update(token).digest('hex');

/** The current registration mode; "invite" until an admin chooses another. */
export async function getRegistrationMode(db: Database): Promise<RegistrationMode> {
	const [row] = await db.select().from(appSetting).where(eq(appSetting.key, REGISTRATION_KEY));
	if (!row) return DEFAULT_REGISTRATION_MODE;
	const value: unknown = JSON.parse(row.value);
	return isRegistrationMode(value) ? value : DEFAULT_REGISTRATION_MODE;
}

export async function setRegistrationMode(
	db: Database,
	mode: RegistrationMode,
	now: number
): Promise<void> {
	await db
		.insert(appSetting)
		.values({ key: REGISTRATION_KEY, value: JSON.stringify(mode), updatedAt: now })
		.onConflictDoUpdate({
			target: appSetting.key,
			set: { value: JSON.stringify(mode), updatedAt: now }
		});
}

export type NewInvite = {
	id: string;
	createdBy: string;
	kind: 'app' | 'run';
	maxUses?: number;
	ttlMs?: number;
	runId?: string;
	memberId?: string;
	role?: 'player' | 'spectator';
};

/** Creates an invitation and returns its token, which is shown once and never stored. */
export async function createInvite(
	db: Pick<Database, 'insert'>,
	input: NewInvite,
	now: number
): Promise<string> {
	const token = randomBytes(24).toString('base64url');
	await db.insert(invite).values({
		id: input.id,
		tokenHash: hashToken(token),
		kind: input.kind,
		runId: input.runId ?? null,
		memberId: input.memberId ?? null,
		role: input.role ?? null,
		createdBy: input.createdBy,
		expiresAt: now + (input.ttlMs ?? 7 * 24 * 60 * 60 * 1000),
		maxUses: input.maxUses ?? 1,
		createdAt: now
	});
	return token;
}

/** The kind of a valid invitation (not revoked, expired or used up), or `null` for any other token. */
export async function validInviteKind(
	db: Database,
	token: string,
	now: number
): Promise<'app' | 'run' | null> {
	const [row] = await db
		.select({ kind: invite.kind })
		.from(invite)
		.where(
			and(
				eq(invite.tokenHash, hashToken(token)),
				isNull(invite.revokedAt),
				gt(invite.expiresAt, now),
				lt(invite.uses, invite.maxUses)
			)
		);
	return row?.kind ?? null;
}

/** Whether a token belongs to an invitation that is not revoked, expired or used up. */
export async function isInviteValid(db: Database, token: string, now: number): Promise<boolean> {
	const [row] = await db
		.select({ id: invite.id })
		.from(invite)
		.where(
			and(
				eq(invite.tokenHash, hashToken(token)),
				isNull(invite.revokedAt),
				gt(invite.expiresAt, now),
				lt(invite.uses, invite.maxUses)
			)
		);
	return Boolean(row);
}

/** Uses an invitation once. Returns false if it stopped being valid (a race with another use). */
export async function consumeInvite(db: Database, token: string, now: number): Promise<boolean> {
	const updated = await db
		.update(invite)
		.set({ uses: sql`${invite.uses} + 1` })
		.where(
			and(
				eq(invite.tokenHash, hashToken(token)),
				isNull(invite.revokedAt),
				gt(invite.expiresAt, now),
				lt(invite.uses, invite.maxUses)
			)
		)
		.returning({ id: invite.id });
	return updated.length === 1;
}

/** Gives back a use, when the registration that consumed it failed. */
export async function releaseInvite(db: Database, token: string): Promise<void> {
	await db
		.update(invite)
		.set({ uses: sql`MAX(${invite.uses} - 1, 0)` })
		.where(eq(invite.tokenHash, hashToken(token)));
}
