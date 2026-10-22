import { json } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { acceptInvite } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { apiError, refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
	const decision = authorize(locals.user, 'invite.accept');
	if (!decision.allowed) return refusal(decision.reason);
	const result = await acceptInvite(await runsDeps(), locals.user!.id, params.token);
	if (!result.ok) return apiError(409, result.error, result.error);
	return json({ runId: result.runId, role: result.role });
};
