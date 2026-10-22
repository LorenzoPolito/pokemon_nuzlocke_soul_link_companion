import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { invite } from '../../auth/index';
import { user } from '../../auth/infrastructure/schema';
import type { Database } from '../../../server/database/client';
import { firstFreeSeat, nextOwner } from '../domain/seats';
import { run, runMember } from '../infrastructure/schema';
import type { RunDeps } from './access';

export type MemberError = 'not_found' | 'last_owner' | 'validation';
export type MemberResult = { ok: true } | { ok: false; error: MemberError };

export const memberChangeSchema = z
	.object({
		role: z.enum(['player', 'spectator']),
		/** A free seat number for a player. */
		seat: z.number().int().min(1).max(50)
	})
	.partial()
	.strict();

type Row = typeof runMember.$inferSelect;

const loadActive = async (db: Pick<Database, 'select'>, runId: string, memberId: string) => {
	const rows = await db
		.select()
		.from(runMember)
		.where(and(eq(runMember.runId, runId), isNull(runMember.removedAt)));
	return { rows, target: rows.find((r) => r.id === memberId) as Row | undefined };
};

/**
 * Changes a member's role or seat (the owner, any time). A player turned spectator loses the
 * seat; their data stay. The owner's own role does not change here (see `transferOwnership`).
 */
export async function changeMember(
	deps: RunDeps,
	runId: string,
	actorId: string,
	memberId: string,
	raw: unknown
): Promise<MemberResult> {
	const parsed = memberChangeSchema.safeParse(raw);
	if (!parsed.success || (parsed.data.role === undefined && parsed.data.seat === undefined))
		return { ok: false, error: 'validation' };
	const now = (deps.now ?? Date.now)();
	const { rows, target } = await loadActive(deps.db, runId, memberId);
	if (!target) return { ok: false, error: 'not_found' };
	if (target.role === 'owner') return { ok: false, error: 'last_owner' };

	const role = parsed.data.role ?? target.role;
	let seat: number | null;
	if (role === 'spectator') {
		if (parsed.data.seat !== undefined) return { ok: false, error: 'validation' };
		seat = null;
	} else if (parsed.data.seat !== undefined) {
		const clash = rows.some((r) => r.id !== target.id && r.seat === parsed.data.seat);
		if (clash) return { ok: false, error: 'validation' };
		seat = parsed.data.seat;
	} else {
		seat = target.seat ?? firstFreeSeat(rows.map((r) => r.seat));
	}
	if (role === target.role && seat === target.seat) return { ok: true };

	await deps.db
		.update(runMember)
		.set({ role: role as 'player' | 'spectator', seat, updatedAt: now })
		.where(eq(runMember.id, target.id));
	await deps.publish?.({
		runId,
		actorUserId: actorId,
		type: 'member.role_changed',
		entity: 'run_member',
		entityId: target.id,
		payload: { before: { role: target.role, seat: target.seat }, after: { role, seat } }
	});
	if (target.userId && role !== target.role) deps.disconnect?.(runId, target.userId);
	return { ok: true };
}

/**
 * Removes a member (the owner) or lets someone leave. The row stays, marked as removed, so the
 * person's encounters, specimens and milestones keep their author; the person no longer sees or
 * follows the run, and the groups stop waiting for them. The owner cannot be removed.
 */
export async function removeMember(
	deps: RunDeps,
	runId: string,
	actorId: string,
	memberId: string
): Promise<MemberResult> {
	const now = (deps.now ?? Date.now)();
	const { target } = await loadActive(deps.db, runId, memberId);
	if (!target) return { ok: false, error: 'not_found' };
	if (target.role === 'owner') return { ok: false, error: 'last_owner' };

	await deps.db.transaction(async (tx) => {
		await tx
			.update(runMember)
			.set({ role: 'spectator', seat: null, removedAt: now, updatedAt: now })
			.where(eq(runMember.id, target.id));
		// A reserved seat's invitation must not work any more.
		await tx
			.update(invite)
			.set({ revokedAt: now })
			.where(and(eq(invite.memberId, target.id), isNull(invite.revokedAt)));
	});
	await deps.publish?.({
		runId,
		actorUserId: actorId,
		type: 'member.removed',
		entity: 'run_member',
		entityId: target.id,
		payload: {
			before: { role: target.role, seat: target.seat, userId: target.userId },
			after: null
		}
	});
	if (target.userId) deps.disconnect?.(runId, target.userId);
	return { ok: true };
}

/** The owner hands the run to another player (a real person with a seat). */
export async function transferOwnership(
	deps: RunDeps,
	runId: string,
	actorId: string,
	memberId: string
): Promise<MemberResult> {
	const now = (deps.now ?? Date.now)();
	const { rows, target } = await loadActive(deps.db, runId, memberId);
	if (!target) return { ok: false, error: 'not_found' };
	const owner = rows.find((r) => r.role === 'owner');
	if (!owner || target.role !== 'player' || target.userId === null)
		return { ok: false, error: 'last_owner' };
	await swapOwner(deps.db, runId, owner, target, rows, now);
	await deps.publish?.({
		runId,
		actorUserId: actorId,
		type: 'run.owner_changed',
		entity: 'run',
		entityId: runId,
		payload: { before: { ownerId: owner.userId }, after: { ownerId: target.userId } }
	});
	return { ok: true };
}

async function swapOwner(
	db: Pick<Database, 'update'>,
	runId: string,
	from: Row,
	to: Row,
	rows: Row[],
	now: number,
	oldOwnerPlays = true
) {
	// The old owner becomes a player (with a seat if they had none); the new owner takes over.
	// A deleted account stops playing instead: it becomes a spectator and the groups stop waiting.
	const seat = oldOwnerPlays ? (from.seat ?? firstFreeSeat(rows.map((r) => r.seat))) : null;
	await db
		.update(runMember)
		.set({ role: oldOwnerPlays ? 'player' : 'spectator', seat, updatedAt: now })
		.where(eq(runMember.id, from.id));
	await db.update(runMember).set({ role: 'owner', updatedAt: now }).where(eq(runMember.id, to.id));
	await db.update(run).set({ ownerId: to.userId!, updatedAt: now }).where(eq(run.id, runId));
}

export type HandedOver = { runId: string; from: string; to: string };

/**
 * When an account is deleted, the runs it owned go to the player with the next seat (docs/backlog
 * P4-02), and the account stops playing in every run. A run where nobody else can take over
 * stays with the anonymised account. Runs inside
 * the caller's transaction; returns what changed so the diary can say so.
 */
export async function handOverRuns(
	tx: Pick<Database, 'select' | 'update'>,
	userId: string,
	now: number
): Promise<HandedOver[]> {
	const owned = await tx
		.select()
		.from(runMember)
		.where(
			and(eq(runMember.userId, userId), eq(runMember.role, 'owner'), isNull(runMember.removedAt))
		);
	const changes: HandedOver[] = [];
	for (const from of owned) {
		const rows = await tx
			.select()
			.from(runMember)
			.where(and(eq(runMember.runId, from.runId), isNull(runMember.removedAt)));
		const live = new Set(
			(
				await tx
					.select({ id: user.id })
					.from(user)
					.where(and(isNull(user.deletedAt), sql`${user.id} <> ${userId}`))
			).map((u) => u.id)
		);
		const candidates = rows.filter(
			(r) => r.role === 'player' && r.userId !== null && live.has(r.userId)
		);
		const to = nextOwner(candidates, from.seat);
		if (!to) continue;
		await swapOwner(tx, from.runId, from, to, rows, now, false);
		changes.push({ runId: from.runId, from: userId, to: to.userId! });
	}
	// A deleted account that played in other runs stops playing: its data stay, the groups stop waiting.
	await tx
		.update(runMember)
		.set({ role: 'spectator', seat: null, updatedAt: now })
		.where(and(eq(runMember.userId, userId), eq(runMember.role, 'player')));
	return changes;
}
