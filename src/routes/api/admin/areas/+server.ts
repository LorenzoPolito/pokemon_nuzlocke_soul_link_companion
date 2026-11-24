import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createCustomArea, listCustomAreas } from '#lib/modules/games/index.js';
import { authorize } from '#lib/modules/auth/index.js';
import { getDatabase } from '#lib/server/database/index.js';
import { apiError, refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

const input = z.object({
	gameId: z.string().min(1),
	name: z.string().trim().min(1).max(120),
	afterAreaKey: z.string().trim().min(1).nullable().optional()
});
export const GET: RequestHandler = async ({ locals, url }) => {
	const decision = authorize(locals.user, 'admin.areas.manage');
	if (!decision.allowed) return refusal(decision.reason);
	const { db } = await getDatabase();
	return json({
		areas: await listCustomAreas(db, url.searchParams.get('gameId') ?? undefined, true)
	});
};
export const POST: RequestHandler = async ({ locals, request }) => {
	const decision = authorize(locals.user, 'admin.areas.manage');
	if (!decision.allowed) return refusal(decision.reason);
	const parsed = input.safeParse(await request.json());
	if (!parsed.success) return apiError(422, 'validation', 'Invalid area');
	const { db } = await getDatabase();
	try {
		return json(await createCustomArea(db, { id: crypto.randomUUID(), ...parsed.data }), {
			status: 201
		});
	} catch (cause) {
		if (String(cause).includes('custom_area_game_name'))
			return apiError(409, 'area_exists', 'Area name already exists');
		throw cause;
	}
};
