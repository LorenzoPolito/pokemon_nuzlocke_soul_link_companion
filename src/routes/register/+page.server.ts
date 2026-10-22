import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getRegistrationMode, registerUser } from '#lib/modules/auth/index.js';
import { getAuth } from '#lib/modules/auth/runtime.js';
import { getDatabase } from '#lib/server/database/index.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, '/');
	const { db } = await getDatabase();
	return { mode: await getRegistrationMode(db), invite: url.searchParams.get('invite') ?? '' };
};

const schema = z.object({
	name: z.string().trim().min(1).max(40),
	email: z.string().trim().email().max(254),
	password: z.string().min(8).max(128),
	invite: z.string().max(200).optional()
});

export const actions: Actions = {
	default: async ({ request }) => {
		const form = schema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) return fail(422, { error: 'validation' as const });
		const { db } = await getDatabase();
		const auth = getAuth();
		const result = await registerUser(
			{ db, auth },
			{
				name: form.data.name,
				email: form.data.email,
				password: form.data.password,
				inviteToken: form.data.invite
			}
		);
		if (!result.ok)
			return fail(result.error === 'email_taken' ? 409 : 403, { error: result.error });
		// The new account signs in at once; the cookie plugin sets the session.
		await auth.api.signInEmail({
			body: { email: form.data.email, password: form.data.password },
			headers: request.headers
		});
		redirect(303, '/');
	}
};
