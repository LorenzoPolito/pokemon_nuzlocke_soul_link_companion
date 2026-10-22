import { fail, redirect } from '@sveltejs/kit';
import { authorize } from '#lib/modules/auth/index.js';
import { listGames } from '#lib/modules/games/index.js';
import { createRunOnce } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import type { Actions, PageServerLoad } from './$types';

const RULES = [
	'dupesClause',
	'typeClause',
	'separateGifts',
	'separateRooms',
	'randomizer',
	'damageCalculator'
] as const;

export const load: PageServerLoad = ({ locals }) => {
	const decision = authorize(locals.user, 'run.create');
	if (!decision.allowed) redirect(303, '/login');
	return {
		// One key per opening of the page: sending the form twice creates one run.
		key: crypto.randomUUID(),
		games: listGames().map((g) => ({ id: g.id, names: g.names, hasDifficulty: g.hasDifficulty }))
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const decision = authorize(locals.user, 'run.create');
		if (!decision.allowed) redirect(303, '/login');
		const form = await request.formData();
		const key = String(form.get('key') ?? '');
		if (!key) return fail(400, { error: 'validation' as const });

		const settings: Record<string, unknown> = Object.fromEntries(
			RULES.map((rule) => [rule, form.get(rule) === 'on'])
		);
		const difficulty = form.get('difficulty');
		const gameId = String(form.get('gameId') ?? '');
		if (typeof difficulty === 'string' && difficulty !== '' && /-2$/.test(gameId)) {
			settings.difficulty = difficulty;
		}
		const body = JSON.stringify({ name: String(form.get('name') ?? ''), gameId, settings });

		const result = await createRunOnce(await runsDeps(), locals.user!.id, key, url.pathname, body);
		const parsed = JSON.parse(result.body);
		if (result.status === 201) redirect(303, `/runs/${parsed.id}`);
		return fail(result.status, {
			error: (parsed.error?.code === 'difficulty_not_available' ? 'difficulty' : 'validation') as
				'difficulty' | 'validation'
		});
	}
};
