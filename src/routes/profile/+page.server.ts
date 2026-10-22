import { fail } from '@sveltejs/kit';
import { passwordChangeSchema, profileSchema } from '#lib/modules/auth/application/profile.js';
import { getAuth } from '#lib/modules/auth/runtime.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	profile: locals.user && {
		name: locals.user.name,
		email: locals.user.email,
		locale: locals.user.locale,
		theme: locals.user.theme
	}
});

export const actions: Actions = {
	profile: async ({ request, cookies }) => {
		const raw = Object.fromEntries(await request.formData());
		const parsed = profileSchema.safeParse({
			name: raw.name,
			locale: raw.locale === '' ? null : raw.locale,
			theme: raw.theme === '' ? null : raw.theme
		});
		if (!parsed.success) return fail(422, { profileError: 'validation' as const });
		await getAuth().api.updateUser({ body: parsed.data, headers: request.headers });
		if (parsed.data.locale)
			cookies.set('PARAGLIDE_LOCALE', parsed.data.locale, {
				path: '/',
				maxAge: 60 * 60 * 24 * 400
			});
		return { profileSaved: true };
	},
	password: async ({ request }) => {
		const parsed = passwordChangeSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(422, { passwordError: 'validation' as const });
		try {
			await getAuth().api.changePassword({
				body: { ...parsed.data, revokeOtherSessions: true },
				headers: request.headers
			});
		} catch {
			return fail(400, { passwordError: 'wrong_password' as const });
		}
		return { passwordSaved: true };
	}
};
