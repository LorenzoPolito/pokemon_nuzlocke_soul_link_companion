import { changeMember, removeMember, requireRun } from '#lib/modules/runs/index.js';
import type { MemberResult } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { errorReply, parseJson, refusedReply, withIdempotency } from '#lib/server/idempotent.js';
import type { RequestHandler } from './$types';

const failed = (result: Extract<MemberResult, { ok: false }>) =>
	result.error === 'not_found'
		? errorReply(404, 'not_found')
		: result.error === 'last_owner'
			? errorReply(409, 'last_owner')
			: errorReply(422, 'validation');

export const PATCH: RequestHandler = async (event) => {
	const deps = await runsDeps();
	return withIdempotency(event, deps.db, async (raw) => {
		const { id, memberId } = event.params;
		const access = await requireRun(deps.db, event.locals.user, id, 'run.members.update');
		if (!access.ok) return refusedReply(access.reason);
		const body = parseJson(raw);
		if (body === undefined) return errorReply(400, 'bad_request');
		const result = await changeMember(deps, id, event.locals.user!.id, memberId, body);
		return result.ok ? { status: 200, body: { ok: true } } : failed(result);
	});
};

/** The owner removes a member; anyone else may only remove themselves (leave the run). */
export const DELETE: RequestHandler = async (event) => {
	const deps = await runsDeps();
	return withIdempotency(event, deps.db, async () => {
		const { id, memberId } = event.params;
		const me = event.locals.user!.id;
		const first = await requireRun(deps.db, event.locals.user, id, 'run.leave');
		if (!first.ok) return refusedReply(first.reason);
		const target = first.run.members.find((m) => m.id === memberId);
		if (!target) return errorReply(404, 'not_found');
		if (target.userId !== me) {
			const access = await requireRun(deps.db, event.locals.user, id, 'run.members.remove');
			if (!access.ok) return refusedReply(access.reason);
		}
		const result = await removeMember(deps, id, me, memberId);
		return result.ok ? { status: 204 } : failed(result);
	});
};
