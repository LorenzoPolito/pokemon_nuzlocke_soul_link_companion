import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import { user } from '../../auth/infrastructure/schema';
import type { RunContext } from '../../auth/index';
import { getGame, type GameId } from '../../games/index';
import type { RunSettings } from '../domain/settings';
import { run, runMember } from '../infrastructure/schema';

export type RunMemberView = {
	id: string;
	userId: string | null;
	name: string;
	role: 'owner' | 'player' | 'spectator';
	seat: number | null;
	pending: boolean;
};

export type RunView = {
	id: string;
	name: string;
	gameId: GameId;
	generation: number;
	settings: RunSettings;
	status: 'active' | 'lost' | 'completed';
	version: number;
	createdAt: number;
	members: RunMemberView[];
};

/**
 * A run and its members as seen by `userId`, plus what `authorize` needs to know about it.
 * Returns `null` when the run does not exist or the user is not a member (a run "does not exist"
 * for non-members, so its existence is not revealed).
 */
export async function getRun(
	db: Database,
	userId: string,
	runId: string
): Promise<{ run: RunView; context: RunContext } | null> {
	const [row] = await db.select().from(run).where(eq(run.id, runId));
	if (!row) return null;

	const members = await db
		.select({
			id: runMember.id,
			userId: runMember.userId,
			displayName: runMember.displayName,
			userName: user.name,
			role: runMember.role,
			seat: runMember.seat
		})
		.from(runMember)
		.leftJoin(user, eq(user.id, runMember.userId))
		.where(and(eq(runMember.runId, runId), isNull(runMember.removedAt)))
		.orderBy(sql`${runMember.seat} is null`, asc(runMember.seat), asc(runMember.createdAt));

	const mine = members.find((m) => m.userId === userId);
	if (!mine) return null;

	return {
		run: {
			id: row.id,
			name: row.name,
			gameId: row.gameId as GameId,
			generation: getGame(row.gameId as GameId).generation,
			settings: JSON.parse(row.settings) as RunSettings,
			status: row.status,
			version: row.version,
			createdAt: row.createdAt,
			members: members.map((m) => ({
				id: m.id,
				userId: m.userId,
				name: m.userName ?? m.displayName ?? '',
				role: m.role,
				seat: m.seat,
				pending: m.userId === null
			}))
		},
		context: { memberRole: mine.role, status: row.status, deleted: row.deletedAt !== null }
	};
}
