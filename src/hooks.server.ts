import { building } from '$app/env';
import type { Handle } from '@sveltejs/kit/hooks';
import { initDatabase } from '#lib/server/database/index.js';

// Configuration or migration errors stop the app here, with their message in the log.
if (!building) {
	try {
		await initDatabase();
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

// Language handling (Paraglide) arrives with P3-05; for now the page is served in Italian.
export const handle: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', 'it') });
