import { z } from 'zod';
import { requireRun, transferOwnership } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { errorReply, parseJson, refusedReply, withIdempotency } from '#lib/server/idempotent.js';
import type { RequestHandler } from './$types';

const bodySchema = z.object({ memberId: z.string().min(1) });

export const POST: RequestHandler = async (event) => {
	const deps = await runsDeps();
	return withIdempotency(event, deps.db, async (raw) => {
		const access = await requireRun(deps.db, event.locals.user, event.params.id, 'run.transfer');
		if (!access.ok) return refusedReply(access.reason);
		const body = bodySchema.safeParse(parseJson(raw));
		if (!body.success) return errorReply(422, 'validation');
		const result = await transferOwnership(
			deps,
			event.params.id,
			event.locals.user!.id,
			body.data.memberId
		);
		if (result.ok) return { status: 200, body: { ok: true } };
		return result.error === 'not_found'
			? errorReply(404, 'not_found')
			: errorReply(409, 'last_owner');
	});
};
