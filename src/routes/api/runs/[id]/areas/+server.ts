import { json } from '@sveltejs/kit';
import { listRunAreas } from '#lib/modules/games/index.js';
import { requireRun } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const deps = await runsDeps();
	const access = await requireRun(deps.db, locals.user, params.id, 'run.read');
	if (!access.ok) return refusal(access.reason);
	return json({ areas: await listRunAreas(deps.db, access.run) });
};
