import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { safeNext } from '#lib/modules/auth/domain/safe-next.js';
import { createThrottle } from '#lib/modules/auth/domain/throttle.js';
import { getAuth } from '#lib/modules/auth/runtime.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
};

// At most 5 login attempts per minute and address (docs/backlog P3-07).
const throttle = createThrottle({ max: 5, windowMs: 60_000 });

const schema = z.object({
	email: z.string().trim().min(1).max(254),
	password: z.string().min(1).max(128)
});

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		if (!throttle.hit(getClientAddress(), Date.now()).allowed) {
			return fail(429, { error: 'too_many_attempts' as const });
		}
		const form = schema.safeParse(Object.fromEntries(await request.formData()));
		if (!form.success) return fail(400, { error: 'invalid_credentials' as const });
		try {
			const result = await getAuth().api.signInEmail({ body: form.data, headers: request.headers });
			const locale = (result.user as { locale?: string | null }).locale;
			if (locale === 'en' || locale === 'it') {
				cookies.set('PARAGLIDE_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 400 });
			}
		} catch (error) {
			const status = (error as { statusCode?: number }).statusCode;
			if (status === 429) return fail(429, { error: 'too_many_attempts' as const });
			if (status === 403) return fail(403, { error: 'account_disabled' as const });
			return fail(401, { error: 'invalid_credentials' as const });
		}
		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
