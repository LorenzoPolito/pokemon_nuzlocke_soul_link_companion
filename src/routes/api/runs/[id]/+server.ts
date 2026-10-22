import { json } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { getRun } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { apiError, refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

/** The run and its members. Groups, encounters and the rest of the snapshot arrive with the tracker. */
export const GET: RequestHandler = async ({ locals, params }) => {
	const unauthenticated = authorize(locals.user, 'run.list');
	if (!unauthenticated.allowed) return refusal(unauthenticated.reason);
	const { db } = await runsDeps();
	const found = await getRun(db, locals.user!.id, params.id);
	if (!found) return apiError(404, 'not_found', 'Run not found');
	const decision = authorize(locals.user, 'run.read', { run: found.context });
	if (!decision.allowed) return refusal(decision.reason);
	return json(found.run);
};
