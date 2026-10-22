import { building } from '$app/env';
import { getRequestEvent } from '$app/server';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { loadConfig } from '../../server/config';
import { getDatabase } from '../../server/database/index.js';
import { ensureAdmin } from './application/ensure-admin';
import { createAuth, type Auth } from './infrastructure/better-auth';
import { loadAuthSecret } from './infrastructure/secret';

let auth: Auth | undefined;

/** Creates the auth instance once at startup, after the database is open. */
export async function startAuth(): Promise<Auth> {
	if (building) throw new Error('Auth must not start during the build');
	if (!auth) {
		const { db } = await getDatabase();
		const { auth: settings, admin } = loadConfig(process.env);
		const secret = loadAuthSecret(settings.secret, settings.dataDir);
		// The admin is created outside any request, so with an instance without the cookie plugin
		// (which needs the current request event).
		const result = await ensureAdmin({ db, auth: createAuth({ db, secret }) }, admin);
		auth = createAuth({ db, secret, extraPlugins: [sveltekitCookies(getRequestEvent)] });
		if (result !== 'exists')
			console.log(
				`Administrator ${result} (${admin.email}): the password must be changed at the first sign-in`
			);
	}
	return auth;
}

export function getAuth(): Auth {
	if (!auth) throw new Error('Auth not started: call startAuth() at startup');
	return auth;
}
