import { json } from '@sveltejs/kit';
import { createRunInvite, listRunInvites, requireRun } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { errorReply, parseJson, refusedReply, withIdempotency } from '#lib/server/idempotent.js';
import { refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const deps = await runsDeps();
	const access = await requireRun(deps.db, locals.user, params.id, 'run.invite');
	if (!access.ok) return refusal(access.reason);
	return json({ items: await listRunInvites(deps, params.id), next: null });
};

export const POST: RequestHandler = async (event) => {
	const deps = await runsDeps();
	return withIdempotency(event, deps.db, async (raw) => {
		const access = await requireRun(deps.db, event.locals.user, event.params.id, 'run.invite');
		if (!access.ok) return refusedReply(access.reason);
		const body = parseJson(raw);
		if (body === undefined) return errorReply(400, 'bad_request');
		const result = await createRunInvite(deps, event.params.id, event.locals.user!.id, body);
		if (!result.ok) return errorReply(422, 'validation', result.issues);
		// The token is shown here and never again.
		return { status: 201, body: result.invite };
	});
};
