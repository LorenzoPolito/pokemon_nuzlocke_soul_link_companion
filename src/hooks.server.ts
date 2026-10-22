import { building } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { passwordGate } from '#lib/modules/auth/domain/password-gate.js';
import { getAuth, startAuth } from '#lib/modules/auth/runtime.js';
import { initDatabase } from '#lib/server/database/index.js';
import { startHub } from '#lib/modules/realtime/runtime.js';
import { startPokedex } from '#lib/server/pokedex/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';

// Configuration, migration or Pokédex errors stop the app here, with their message in the log.
if (!building) {
	try {
		await initDatabase();
		await startAuth();
		await startHub();
		await startPokedex();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

// The language comes from the cookie, then the browser, then English (see vite.config.ts).
const language: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale }) =>
		resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%lang%', locale).replace('%theme%', event.locals.user?.theme ?? 'system')
		})
	);

/** Reads the session into `event.locals.user` and serves the Better Auth routes. */
const session: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	if (!building) {
		const current = await getAuth().api.getSession({ headers: event.request.headers });
		if (current) {
			const u = current.user as typeof current.user & Record<string, unknown>;
			event.locals.user = {
				id: u.id,
				name: u.name,
				email: u.email,
				role: u.role === 'admin' ? 'admin' : 'user',
				disabled: u.banned === true,
				mustChangePassword: u.mustChangePassword === true,
				locale: typeof u.locale === 'string' ? u.locale : null,
				theme: typeof u.theme === 'string' ? u.theme : null
			};
		}
	}
	return svelteKitHandler({ auth: getAuthSafe(), event, resolve, building });
};

// During the build there is no auth instance; the handler is not called then.
const getAuthSafe = () => (building ? ({} as ReturnType<typeof getAuth>) : getAuth());

const PUBLIC = [
	/^\/login$/,
	/^\/register$/,
	/^\/api\/health$/,
	/^\/api\/auth\//,
	/^\/robots\.txt$/
];

/** Anyone not signed in goes to the login page (401 for API calls). */
const guard: Handle = ({ event, resolve }) => {
	const path = event.url.pathname;
	if (event.locals.user || PUBLIC.some((p) => p.test(path))) return resolve(event);
	if (path.startsWith('/api/')) {
		return new Response(
			JSON.stringify({ error: { code: 'unauthenticated', message: 'Sign in first' } }),
			{
				status: 401,
				headers: { 'content-type': 'application/json' }
			}
		);
	}
	redirect(303, '/login');
};

/** A user who must change the password can do nothing else until they have. */
const passwordChange: Handle = ({ event, resolve }) => {
	const pending = event.locals.user?.mustChangePassword === true;
	const decision = passwordGate(pending, event.request.method, event.url.pathname);
	if (decision === 'redirect') redirect(303, '/change-password');
	if (decision === 'refuse') {
		return new Response(
			JSON.stringify({
				error: { code: 'password_change_required', message: 'Change your password first' }
			}),
			{ status: 403, headers: { 'content-type': 'application/json' } }
		);
	}
	return resolve(event);
};

export const handle = sequence(language, session, guard, passwordChange);
