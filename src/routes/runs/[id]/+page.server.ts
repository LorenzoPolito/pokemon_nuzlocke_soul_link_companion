import { error } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { listGames } from '#lib/modules/games/index.js';
import { getRun } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { db } = await runsDeps();
	const found = await getRun(db, locals.user!.id, params.id);
	if (!found) error(404, 'Not found');
	const decision = authorize(locals.user, 'run.read', { run: found.context });
	if (!decision.allowed) error(404, 'Not found');
	const game = listGames().find((g) => g.id === found.run.gameId)!;
	return { run: found.run, role: found.context.memberRole!, gameNames: game.names };
};
