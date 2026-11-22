import { and, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createInvite, hashToken, invite } from '../../auth/index';
import { user } from '../../auth/infrastructure/schema';
import { createUuidV7 } from '../../realtime/domain/uuidv7';
import { getGame, type GameId } from '../../games/index';
import { firstFreeSeat } from '../domain/seats';
import type { RunSettings } from '../domain/settings';
import { run, runMember } from '../infrastructure/schema';
import type { RunDeps } from './access';

const defaultNewId = createUuidV7();
const DAY = 24 * 60 * 60 * 1000;

export const newInviteSchema = z.object({
	role: z.enum(['player', 'spectator']),
	/** Reserves a seat with this name; without it the link is open to whoever receives it. */
	seatName: z.string().trim().min(1).max(40).optional(),
	maxUses: z.number().int().min(1).max(20).default(1),
	/** Days until it expires. */
	expiresInDays: z.number().int().min(1).max(30).default(7)
});

export type NewRunInvite = z.input<typeof newInviteSchema>;

export type RunInviteRow = {
	id: string;
	role: 'player' | 'spectator';
	seatName: string | null;
	uses: number;
	maxUses: number;
	expiresAt: number;
	status: 'valid' | 'revoked' | 'expired' | 'used';
};

const statusOf = (
	row: { revokedAt: number | null; expiresAt: number; uses: number; maxUses: number },
	now: number
): RunInviteRow['status'] =>
	row.revokedAt !== null
		? 'revoked'
		: row.expiresAt <= now
			? 'expired'
			: row.uses >= row.maxUses
				? 'used'
				: 'valid';

/** The invitations of a run, newest first, with their state. Tokens are never listed. */
export async function listRunInvites(
	deps: Pick<RunDeps, 'db' | 'now'>,
	runId: string
): Promise<RunInviteRow[]> {
	const now = (deps.now ?? Date.now)();
	const rows = await deps.db
		.select({
			id: invite.id,
			role: invite.role,
			seatName: runMember.displayName,
			uses: invite.uses,
			maxUses: invite.maxUses,
			expiresAt: invite.expiresAt,
			revokedAt: invite.revokedAt
		})
		.from(invite)
		.leftJoin(runMember, eq(runMember.id, invite.memberId))
		.where(and(eq(invite.kind, 'run'), eq(invite.runId, runId)))
		.orderBy(desc(invite.createdAt));
	return rows.map((r) => ({
		id: r.id,
		role: r.role ?? 'player',
		seatName: r.seatName,
		uses: r.uses,
		maxUses: r.maxUses,
		expiresAt: r.expiresAt,
		status: statusOf(r, now)
	}));
}

export type CreatedRunInvite = { id: string; token: string; memberId: string | null };

/**
 * Creates an invitation to a run. With `seatName` it reserves a pending seat (the person who
 * accepts takes it with the data already entered); without, the link makes a new member.
 */
export async function createRunInvite(
	deps: RunDeps,
	runId: string,
	actorId: string,
	raw: unknown
): Promise<
	{ ok: true; invite: CreatedRunInvite } | { ok: false; error: 'validation'; issues?: unknown }
> {
	const parsed = newInviteSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, error: 'validation', issues: parsed.error.issues };
	const { role, seatName, maxUses, expiresInDays } = parsed.data;
	const now = (deps.now ?? Date.now)();
	const newId = deps.newId ?? defaultNewId;

	let memberId: string | null = null;
	let token = '';
	let refused = false;
	await deps.db.transaction(async (tx) => {
		if (seatName) {
			const members = await tx
				.select({ name: runMember.displayName, seat: runMember.seat, userId: runMember.userId })
				.from(runMember)
				.where(and(eq(runMember.runId, runId), isNull(runMember.removedAt)));
			const taken = await tx
				.select({ name: user.name })
				.from(runMember)
				.innerJoin(user, eq(user.id, runMember.userId))
				.where(and(eq(runMember.runId, runId), isNull(runMember.removedAt)));
			const names = [...members.map((m) => m.name), ...taken.map((t) => t.name)]
				.filter((n): n is string => !!n)
				.map((n) => n.toLowerCase());
			if (names.includes(seatName.toLowerCase())) {
				refused = true;
				return;
			}
			memberId = newId();
			await tx.insert(runMember).values({
				id: memberId,
				runId,
				userId: null,
				displayName: seatName,
				role,
				seat: role === 'player' ? firstFreeSeat(members.map((m) => m.seat)) : null,
				createdAt: now,
				updatedAt: now
			});
		}
		token = await createInvite(
			tx,
			{
				id: newId(),
				createdBy: actorId,
				kind: 'run',
				runId,
				memberId: memberId ?? undefined,
				role,
				maxUses: seatName ? 1 : maxUses,
				ttlMs: expiresInDays * DAY
			},
			now
		);
	});
	if (refused) return { ok: false, error: 'validation', issues: [{ path: ['seatName'] }] };

	const [row] = await deps.db
		.select({ id: invite.id })
		.from(invite)
		.where(eq(invite.tokenHash, hashToken(token)));
	return { ok: true, invite: { id: row!.id, token, memberId } };
}

/** Revokes an invitation of this run. The reserved seat, if any, stays pending. */
export async function revokeRunInvite(
	deps: Pick<RunDeps, 'db' | 'now'>,
	runId: string,
	inviteId: string
): Promise<boolean> {
	const updated = await deps.db
		.update(invite)
		.set({ revokedAt: (deps.now ?? Date.now)() })
		.where(and(eq(invite.id, inviteId), eq(invite.runId, runId), eq(invite.kind, 'run')))
		.returning({ id: invite.id });
	return updated.length === 1;
}

export type InvitePreview =
	| { kind: 'app' }
	| {
			kind: 'run';
			runName: string;
			gameId: GameId;
			generation: number;
			role: 'player' | 'spectator';
			seatName: string | null;
			settings: RunSettings;
			members: { name: string; role: string; pending: boolean }[];
	  };

const validInvite = (tokenHash: string, now: number) =>
	and(
		eq(invite.tokenHash, tokenHash),
		isNull(invite.revokedAt),
		gt(invite.expiresAt, now),
		lt(invite.uses, invite.maxUses)
	);

/**
 * What the holder of a token may see before accepting: the run, the role offered, the rules
 * and who takes part. `null` for any token that does not work, without saying why.
 */
export async function previewInvite(
	deps: Pick<RunDeps, 'db' | 'now'>,
	token: string
): Promise<InvitePreview | null> {
	const now = (deps.now ?? Date.now)();
	const [row] = await deps.db
		.select()
		.from(invite)
		.where(validInvite(hashToken(token), now));
	if (!row) return null;
	if (row.kind === 'app') return { kind: 'app' };
	if (!row.runId) return null;
	const [found] = await deps.db.select().from(run).where(eq(run.id, row.runId));
	if (!found || found.deletedAt !== null) return null;
	const members = await deps.db
		.select({
			id: runMember.id,
			name: user.name,
			displayName: runMember.displayName,
			role: runMember.role,
			userId: runMember.userId
		})
		.from(runMember)
		.leftJoin(user, eq(user.id, runMember.userId))
		.where(and(eq(runMember.runId, row.runId), isNull(runMember.removedAt)))
		.orderBy(sql`${runMember.seat} is null`, runMember.seat, runMember.createdAt);
	return {
		kind: 'run',
		runName: found.name,
		gameId: found.gameId as GameId,
		generation: getGame(found.gameId as GameId).generation,
		role: row.role ?? 'player',
		seatName: members.find((m) => m.id === row.memberId)?.displayName ?? null,
		settings: JSON.parse(found.settings) as RunSettings,
		members: members.map((m) => ({
			name: m.name ?? m.displayName ?? '',
			role: m.role,
			pending: m.userId === null
		}))
	};
}

export type AcceptError = 'invite_invalid' | 'already_member' | 'run_not_active';

/**
 * Accepts an invitation as `userId`. All or nothing: the use is counted, and the person takes
 * the reserved seat or becomes a new member (or comes back to their old seat, with their data,
 * if they had been removed). Two people opening a single-use link: the first wins.
 */
export async function acceptInvite(
	deps: RunDeps,
	userId: string,
	token: string
): Promise<
	{ ok: true; runId: string; role: 'player' | 'spectator' } | { ok: false; error: AcceptError }
> {
	const now = (deps.now ?? Date.now)();
	const newId = deps.newId ?? defaultNewId;
	const hash = hashToken(token);

	const [row] = await deps.db.select().from(invite).where(validInvite(hash, now));
	if (!row || row.kind !== 'run' || !row.runId || !row.role)
		return { ok: false, error: 'invite_invalid' };
	const runId = row.runId;
	const role = row.role;
	const [found] = await deps.db.select().from(run).where(eq(run.id, runId));
	if (!found || found.deletedAt !== null) return { ok: false, error: 'invite_invalid' };
	if (found.status !== 'active') return { ok: false, error: 'run_not_active' };

	let memberId = '';
	let error: AcceptError | null = null;
	await deps.db
		.transaction(async (tx) => {
			const members = await tx.select().from(runMember).where(eq(runMember.runId, runId));
			const mine = members.find((m) => m.userId === userId);
			if (mine && mine.removedAt === null) {
				error = 'already_member';
				return;
			}
			// The use is counted first, in one conditional update: a second person loses the race here.
			const used = await tx
				.update(invite)
				.set({ uses: sql`${invite.uses} + 1` })
				.where(validInvite(hash, now))
				.returning({ id: invite.id });
			if (used.length !== 1) {
				error = 'invite_invalid';
				return;
			}
			const active = members.filter((m) => m.removedAt === null);
			const seat = role === 'player' ? firstFreeSeat(active.map((m) => m.seat)) : null;

			if (row.memberId) {
				const seatRow = members.find((m) => m.id === row.memberId);
				if (!seatRow || seatRow.userId !== null || seatRow.removedAt !== null) {
					error = 'invite_invalid';
					tx.rollback();
					return;
				}
				if (mine) await tx.delete(runMember).where(eq(runMember.id, mine.id));
				await tx
					.update(runMember)
					.set({ userId, displayName: null, updatedAt: now })
					.where(eq(runMember.id, seatRow.id));
				memberId = seatRow.id;
			} else if (mine) {
				await tx
					.update(runMember)
					.set({ role, seat, removedAt: null, updatedAt: now })
					.where(eq(runMember.id, mine.id));
				memberId = mine.id;
			} else {
				memberId = newId();
				await tx
					.insert(runMember)
					.values({ id: memberId, runId, userId, role, seat, createdAt: now, updatedAt: now });
			}
		})
		.catch((e: unknown) => {
			if (!error) throw e;
		});
	if (error) return { ok: false, error };

	await deps.publish?.({
		runId,
		actorUserId: userId,
		type: 'member.joined',
		entity: 'run_member',
		entityId: memberId,
		payload: { before: null, after: { userId, role } }
	});
	return { ok: true, runId, role };
}

/**
 * Declines an invitation. For a reserved seat the invitation is revoked and the seat stays
 * pending; an open link is left for the others. Returns false when the token does not work.
 */
export async function declineInvite(
	deps: RunDeps,
	userId: string,
	token: string
): Promise<boolean> {
	const now = (deps.now ?? Date.now)();
	const [row] = await deps.db
		.select()
		.from(invite)
		.where(validInvite(hashToken(token), now));
	if (!row || row.kind !== 'run' || !row.runId) return false;
	if (row.memberId) {
		await deps.db.update(invite).set({ revokedAt: now }).where(eq(invite.id, row.id));
		await deps.publish?.({
			runId: row.runId,
			actorUserId: userId,
			type: 'member.declined',
			entity: 'run_member',
			entityId: row.memberId,
			payload: { before: null, after: { userId } }
		});
	}
	return true;
}
