import { redirect } from '@sveltejs/kit';
import { getAuth } from '#lib/modules/auth/runtime.js';
import type { RequestHandler } from './$types';

/** Signs out. POST only, so a link or an image cannot do it. */
export const POST: RequestHandler = async ({ request }) => {
	await getAuth().api.signOut({ headers: request.headers });
	redirect(303, '/login');
};
