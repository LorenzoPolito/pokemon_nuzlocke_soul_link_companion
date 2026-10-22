import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../../../server/database/client';
import { run, runMember } from '../../runs/infrastructure/schema';
import type { AccessPolicy } from '../application/hub';

/**
 * Who may follow which run: its members, spectators included, as long as they have not been
 * removed and the run is not deleted. A run that does not exist, or that the person is not part
 * of, looks the same: not visible.
 */
export function runMemberAccess(db: Database): AccessPolicy {
	return {
		async canStream(userId, runId) {
			const [row] = await db
				.select({ id: runMember.id })
				.from(runMember)
				.innerJoin(run, eq(run.id, runMember.runId))
				.where(
					and(
						eq(runMember.runId, runId),
						eq(runMember.userId, userId),
						isNull(runMember.removedAt),
						isNull(run.deletedAt)
					)
				);
			return Boolean(row);
		}
	};
}

/** Nobody may follow a run: for tests that need an access policy that always refuses. */
export const noRunsYet: AccessPolicy = { canStream: async () => false };
