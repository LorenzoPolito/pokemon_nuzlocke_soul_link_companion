import { recordEncounter } from '#lib/modules/runs/index.js';
import { requireRun } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { errorReply, parseJson, refusedReply, withIdempotency } from '#lib/server/idempotent.js';
import type { RequestHandler } from './$types';

const status: Record<string, number> = {
	area_taken: 409,
	dupe_clause_required: 409,
	dupe_clause_not_applicable: 409,
	gift_outcome_invalid: 422,
	area_not_found: 422,
	member_not_player: 422,
	validation: 422
};

export const POST: RequestHandler = async (event) => {
	const deps = await runsDeps();
	return withIdempotency(event, deps.db, async (raw) => {
		const readable = await requireRun(deps.db, event.locals.user, event.params.id, 'run.read');
		if (!readable.ok) return refusedReply(readable.reason);
		const body = parseJson(raw);
		if (body === undefined || typeof body !== 'object' || body === null)
			return errorReply(400, 'bad_request');
		const memberId =
			'memberId' in body && typeof body.memberId === 'string' ? body.memberId : undefined;
		const target = memberId
			? readable.run.members.find((member) => member.id === memberId)
			: undefined;
		const ownData = target?.userId === event.locals.user?.id;
		const access = await requireRun(
			deps.db,
			event.locals.user,
			event.params.id,
			'encounter.create',
			{ ownData }
		);
		if (!access.ok) return refusedReply(access.reason);
		const result = await recordEncounter(deps, access.run, event.locals.user!.id, body);
		return result.ok
			? { status: 201, body: result }
			: errorReply(status[result.error] ?? 422, result.error);
	});
};
