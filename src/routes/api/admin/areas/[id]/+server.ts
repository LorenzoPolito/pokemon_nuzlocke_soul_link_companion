import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { updateCustomArea } from '#lib/modules/games/index.js';
import { authorize } from '#lib/modules/auth/index.js';
import { getDatabase } from '#lib/server/database/index.js';
import { apiError, refusal } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

const input = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		afterAreaKey: z.string().trim().min(1).nullable().optional(),
		archived: z.boolean().optional()
	})
	.refine((value) => Object.keys(value).length > 0);
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const decision = authorize(locals.user, 'admin.areas.manage');
	if (!decision.allowed) return refusal(decision.reason);
	const parsed = input.safeParse(await request.json());
	if (!parsed.success) return apiError(422, 'validation', 'Invalid area');
	const { db } = await getDatabase();
	const updated = await updateCustomArea(db, params.id, parsed.data);
	return updated ? json(updated) : apiError(404, 'not_found', 'Area not found');
};
