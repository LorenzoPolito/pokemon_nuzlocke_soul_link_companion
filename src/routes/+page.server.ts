import { listRuns, type RunFilter } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { listGames } from '#lib/modules/games/index.js';
import type { PageServerLoad } from './$types';

const FILTERS: RunFilter[] = ['active', 'ended', 'all'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const asked = url.searchParams.get('filter') as RunFilter | null;
	const filter: RunFilter = asked && FILTERS.includes(asked) ? asked : 'all';
	const { db } = await runsDeps();
	return {
		filter,
		runs: await listRuns(db, locals.user!.id, { filter }),
		games: Object.fromEntries(listGames().map((g) => [g.id, g.names]))
	};
};
