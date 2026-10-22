import { building } from '$app/env';
import { getRequestEvent } from '$app/server';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { loadConfig } from '../../server/config';
import { getDatabase } from '../../server/database/index.js';
import { createAuth, type Auth } from './infrastructure/better-auth';
import { loadAuthSecret } from './infrastructure/secret';

let auth: Auth | undefined;

/** Creates the auth instance once at startup, after the database is open. */
export async function startAuth(): Promise<Auth> {
	if (building) throw new Error('Auth must not start during the build');
	if (!auth) {
		const { db } = await getDatabase();
		const { auth: settings } = loadConfig(process.env);
		auth = createAuth({
			db,
			secret: loadAuthSecret(settings.secret, settings.dataDir),
			extraPlugins: [sveltekitCookies(getRequestEvent)]
		});
	}
	return auth;
}

export function getAuth(): Auth {
	if (!auth) throw new Error('Auth not started: call startAuth() at startup');
	return auth;
}
