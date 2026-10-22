import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import type { BetterAuthPlugin } from 'better-auth';
import type { Database } from '../../../server/database/client';
import * as schema from './schema';

const WEEK = 60 * 60 * 24 * 7;

export type AuthOptions = {
	db: Database;
	secret: string;
	/** Cookie plugin for SvelteKit; left out in tests that call the API directly. */
	extraPlugins?: BetterAuthPlugin[];
};

/**
 * Better Auth configured for the app.
 * - Passwords: scrypt hashes only. Sessions last 7 days.
 * - Login attempts: at most 5 per minute and address.
 * - Public sign-up is disabled at the HTTP level: registration goes through `registerUser`,
 *   which applies the registration mode and the invitations.
 */
export function createAuth({ db, secret, extraPlugins = [] }: AuthOptions) {
	return betterAuth({
		secret,
		database: drizzleAdapter(db, { provider: 'sqlite', schema }),
		emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
		session: { expiresIn: WEEK, updateAge: 60 * 60 * 24 },
		rateLimit: {
			enabled: true,
			window: 60,
			max: 100,
			customRules: { '/sign-in/email': { window: 60, max: 5 } }
		},
		disabledPaths: ['/sign-up/email'],
		user: {
			additionalFields: {
				mustChangePassword: { type: 'boolean', defaultValue: false, input: false },
				locale: { type: 'string', required: false },
				theme: { type: 'string', required: false },
				deletedAt: { type: 'date', required: false, input: false }
			}
		},
		plugins: [admin(), ...extraPlugins]
	});
}

export type Auth = ReturnType<typeof createAuth>;
