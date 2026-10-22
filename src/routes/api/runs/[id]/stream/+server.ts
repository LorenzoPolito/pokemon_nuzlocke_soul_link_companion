import { json } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { getHub } from '#lib/modules/realtime/runtime.js';
import type { RequestHandler } from './$types';

/**
 * Stream of a run's events (docs/progetto/16, P2-10). The last event id comes from the
 * `Last-Event-ID` header (the browser's own reconnection) or from `?lastEventId=` (a manual one).
 */
export const GET: RequestHandler = async ({ params, locals, request, url }) => {
	const user = locals.user;
	// Whether the user is a member is decided by the hub's access policy; `authorize` covers the account.
	const account = authorize(user, 'run.stream', {
		run: { memberRole: 'spectator', status: 'active', deleted: false }
	});
	if (!account.allowed) {
		return json(
			{ error: { code: account.reason, message: account.reason } },
			{ status: account.reason === 'unauthenticated' ? 401 : 403 }
		);
	}
	const lastEventId =
		request.headers.get('last-event-id') ?? url.searchParams.get('lastEventId') ?? undefined;
	const result = await getHub().connect({ userId: user!.id, runId: params.id, lastEventId });
	if (!result.ok)
		return json({ error: { code: 'not_found', message: 'Run not found' } }, { status: 404 });
	return new Response(result.stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			// Tells nginx not to buffer the stream (docs/progetto/14, P1-16).
			'x-accel-buffering': 'no'
		}
	});
};
