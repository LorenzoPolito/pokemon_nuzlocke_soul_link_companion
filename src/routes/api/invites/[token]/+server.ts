import { json } from '@sveltejs/kit';
import { previewInvite } from '#lib/modules/runs/index.js';
import { runsDeps } from '#lib/modules/runs/runtime.js';
import { apiError } from '#lib/server/http.js';
import type { RequestHandler } from './$types';

/** Public: what the holder of a link may see before accepting. Any token that does not work gets the same 404. */
export const GET: RequestHandler = async ({ params }) => {
	const preview = await previewInvite(await runsDeps(), params.token);
	if (!preview) return apiError(404, 'invite_invalid', 'This invitation does not work');
	return json(preview);
};
