import { authorize } from '#lib/modules/auth/index.js';
import { declineInvite } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { apiError, refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
	const decision = authorize(locals.user, 'invite.accept');
	if (!decision.allowed) return refusal(decision.reason);
	if (!(await declineInvite(await runsDeps(), locals.user!.id, params.token)))
		return apiError(409, 'invite_invalid', 'This invitation does not work');
	return new Response(null, { status: 204 });
};
