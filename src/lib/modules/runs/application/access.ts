import type { Database } from '../../../server/database/client';
import { authorize, type Action, type Actor, type DenyReason } from '../../auth/index';
import type { NewRunEvent } from '../../realtime/index';
import { getRun, type RunView } from './get-run';

/** What the use cases need besides the database: the diary, the stream and the clock. */
export type RunDeps = {
	db: Database;
	/** Writes an entry in the diary and sends it to the people following the run (the hub). */
	publish?: (event: NewRunEvent) => Promise<unknown>;
	/** Closes the stream of a person whose access to a run changed. */
	disconnect?: (runId: string, userId: string) => void;
	now?: () => number;
	newId?: () => string;
};

export type RunAccess =
	| { ok: true; run: RunView; role: 'owner' | 'player' | 'spectator' }
	| { ok: false; reason: DenyReason };

/**
 * Loads a run for a person and asks `authorize` whether they may do `action` on it. The role
 * comes from the database at every request, never from the client. A run the person is not a
 * member of is `not_found`.
 */
export async function requireRun(
	db: Database,
	actor: Actor,
	runId: string,
	action: Action,
	options: { ownData?: boolean } = {}
): Promise<RunAccess> {
	const first = authorize(actor, 'run.list');
	if (!first.allowed) return { ok: false, reason: first.reason };
	const found = await getRun(db, actor!.id, runId);
	if (!found) return { ok: false, reason: 'not_found' };
	const decision = authorize(actor, action, { run: found.context, ownData: options.ownData });
	if (!decision.allowed) return { ok: false, reason: decision.reason };
	return { ok: true, run: found.run, role: found.context.memberRole! };
}
