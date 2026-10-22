import { json } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { createRunOnce, listRuns } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { apiError, refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const decision = authorize(locals.user, 'run.list');
	if (!decision.allowed) return refusal(decision.reason);
	const status = url.searchParams.get('status');
	if (status !== null && status !== 'active' && status !== 'ended') {
		return apiError(422, 'validation', 'status must be active or ended');
	}
	const { db } = await runsDeps();
	const items = await listRuns(db, locals.user!.id, {
		filter: status ?? 'all',
		deleted: url.searchParams.get('deleted') === 'true'
	});
	return json({ items, next: null });
};

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const decision = authorize(locals.user, 'run.create');
	if (!decision.allowed) return refusal(decision.reason);
	const key = request.headers.get('idempotency-key');
	if (!key) return apiError(400, 'idempotency_key_required', 'Send an Idempotency-Key header');
	const result = await createRunOnce(
		await runsDeps(),
		locals.user!.id,
		key,
		url.pathname,
		await request.text()
	);
	return new Response(result.body, {
		status: result.status,
		headers: {
			'content-type': 'application/json',
			...(result.replayed ? { 'idempotent-replay': 'true' } : {})
		}
	});
};
