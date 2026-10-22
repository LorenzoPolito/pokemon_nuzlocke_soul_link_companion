import type { Handle } from '@sveltejs/kit/hooks';

// Language handling (Paraglide) arrives with P3-05; for now the page is served in Italian.
export const handle: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', 'it') });
