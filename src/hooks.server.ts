import { building } from '$app/env';
import type { Handle } from '@sveltejs/kit/hooks';
import { initDatabase } from '#lib/server/database/index.js';
import { startPokedex } from '#lib/server/pokedex/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';

// Configuration, migration or Pokédex errors stop the app here, with their message in the log.
if (!building) {
	try {
		await initDatabase();
		await startPokedex();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

// The language comes from the cookie, then the browser, then English (see vite.config.ts).
export const handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale }) =>
		resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', locale) })
	);
