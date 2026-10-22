import { fail, redirect } from '@sveltejs/kit';
import { passwordChangeSchema } from '#lib/modules/auth/application/profile.js';
import { getAuth } from '#lib/modules/auth/runtime.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user?.mustChangePassword) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request }) => {
		const parsed = passwordChangeSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(422, { error: 'validation' as const });
		if (parsed.data.newPassword === parsed.data.currentPassword) {
			return fail(422, { error: 'same_password' as const });
		}
		try {
			await getAuth().api.changePassword({
				body: { ...parsed.data, revokeOtherSessions: true },
				headers: request.headers
			});
		} catch {
			return fail(400, { error: 'wrong_password' as const });
		}
		redirect(303, '/');
	}
};
