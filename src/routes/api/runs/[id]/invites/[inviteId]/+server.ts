import { requireRun, revokeRunInvite } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { errorReply, refusedReply, withIdempotency } from '#lib/server/idempotent.js';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	const deps = await runsDeps();
	return withIdempotency(event, deps.db, async () => {
		const access = await requireRun(deps.db, event.locals.user, event.params.id, 'run.invite');
		if (!access.ok) return refusedReply(access.reason);
		if (!(await revokeRunInvite(deps, event.params.id, event.params.inviteId)))
			return errorReply(404, 'not_found');
		return { status: 204 };
	});
};
