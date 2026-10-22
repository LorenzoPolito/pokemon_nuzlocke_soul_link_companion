import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	user: locals.user
		? { name: locals.user.name, role: locals.user.role, locale: locals.user.locale }
		: null
});
