import { json } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { profileSchema } from '#lib/modules/auth/application/profile.js';
import { getAuth } from '#lib/modules/auth/runtime.js';
import type { RequestHandler } from './$types';

const refusal = (reason: string) =>
	json(
		{ error: { code: reason, message: reason } },
		{ status: reason === 'unauthenticated' ? 401 : 403 }
	);

export const GET: RequestHandler = ({ locals }) => {
	const decision = authorize(locals.user, 'me.read');
	if (!decision.allowed) return refusal(decision.reason);
	return json(locals.user);
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const decision = authorize(locals.user, 'me.update');
	if (!decision.allowed) return refusal(decision.reason);
	const parsed = profileSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return json(
			{
				error: { code: 'validation', message: 'Invalid profile data', details: parsed.error.issues }
			},
			{ status: 422 }
		);
	}
	await getAuth().api.updateUser({ body: parsed.data, headers: request.headers });
	return json({ ...locals.user, ...parsed.data });
};
