import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
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
		// The `Secure` attribute is added per request in hooks.server.ts (it depends on whether the
		// request came in over HTTPS); Better Auth must not decide it from NODE_ENV, or sign-in
		// would break over plain HTTP.
		advanced: { useSecureCookies: false },
		disabledPaths: ['/sign-up/email'],
		user: {
			additionalFields: {
				mustChangePassword: { type: 'boolean', defaultValue: false, input: false },
				locale: { type: 'string', required: false },
				theme: { type: 'string', required: false },
				deletedAt: { type: 'date', required: false, input: false }
			}
		},
		hooks: {
			// A successful password change ends the "must change password" state, whichever way it
			// was called (form, API or HTTP endpoint).
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== '/change-password') return;
				// The hook also runs after a failed call: only a success may clear the flag.
				if (ctx.context.returned instanceof Error) return;
				const userId = ctx.context.session?.user.id ?? ctx.context.newSession?.user.id;
				if (!userId) return;
				await ctx.context.internalAdapter.updateUser(userId, { mustChangePassword: false });
			})
		},
		plugins: [admin(), ...extraPlugins]
	});
}

export type Auth = ReturnType<typeof createAuth>;
