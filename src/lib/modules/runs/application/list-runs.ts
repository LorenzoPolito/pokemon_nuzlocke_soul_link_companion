import { and, desc, eq, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import { getGame, type GameId } from '../../games/index';
import { run, runMember } from '../infrastructure/schema';
import type { RunSettings } from '../domain/settings';

export type RunFilter = 'active' | 'ended' | 'all';

export type RunListItem = {
	id: string;
	name: string;
	gameId: string;
	generation: number;
	/** Players, pending seats included; spectators do not count. */
	players: number;
	status: 'active' | 'lost' | 'completed';
	role: 'owner' | 'player' | 'spectator';
	lastActivity: number;
	randomizer: boolean;
	/**
	 * What the viewer sees at a glance. The counters stay at zero until groups and milestones
	 * exist (P4-06 and P4-15 fill them in).
	 */
	summary: { badges: number; alive: number; dead: number };
};

export type ListOptions = { filter?: RunFilter; deleted?: boolean };

/** The runs of a user, newest activity first. Deleted runs appear only when asked, and only to their owner. */
export async function listRuns(
	db: Database,
	userId: string,
	{ filter = 'all', deleted = false }: ListOptions = {}
): Promise<RunListItem[]> {
	const conditions = [eq(runMember.userId, userId), isNull(runMember.removedAt)];
	if (deleted) conditions.push(isNotNull(run.deletedAt), eq(runMember.role, 'owner'));
	else conditions.push(isNull(run.deletedAt));
	if (filter === 'active') conditions.push(eq(run.status, 'active'));
	if (filter === 'ended') conditions.push(ne(run.status, 'active'));

	const rows = await db
		.select({
			id: run.id,
			name: run.name,
			gameId: run.gameId,
			status: run.status,
			settings: run.settings,
			updatedAt: run.updatedAt,
			role: runMember.role,
			players: sql<number>`(select count(*) from ${runMember} as m where m.run_id = ${run.id} and m.role <> 'spectator' and m.removed_at is null)`
		})
		.from(runMember)
		.innerJoin(run, eq(run.id, runMember.runId))
		.where(and(...conditions))
		.orderBy(desc(run.updatedAt));

	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		gameId: r.gameId,
		generation: getGame(r.gameId as GameId).generation,
		players: Number(r.players),
		status: r.status,
		role: r.role,
		lastActivity: r.updatedAt,
		randomizer: (JSON.parse(r.settings) as RunSettings).randomizer,
		summary: { badges: 0, alive: 0, dead: 0 }
	}));
}
