import { z } from 'zod';

/**
 * Runtime configuration, read once at startup from environment variables.
 * An invalid configuration stops the app with a message naming each wrong variable.
 */
const envSchema = z
	.object({
		/** Directory of the local database file. The container image sets it to `/data`. */
		DATA_DIR: z.string().min(1).default('./data'),
		/** Remote database (Turso). When set, the local file is not used. */
		TURSO_URL: z.string().min(1).optional(),
		TURSO_TOKEN: z.string().min(1).optional(),
		/** Read-only Pokédex file, generated at build time. */
		POKEDEX_PATH: z.string().min(1).default('./data/pokedex/pokedex.sqlite'),
		/** Secret that signs sessions. When missing, one is generated and kept in DATA_DIR. */
		AUTH_SECRET: z.string().min(32).optional(),
		/** In production a missing or outdated Pokédex stops the app; elsewhere it only warns. */
		NODE_ENV: z.string().optional()
	})
	.superRefine((env, ctx) => {
		if (env.TURSO_URL && !env.TURSO_TOKEN) {
			ctx.addIssue({
				code: 'custom',
				path: ['TURSO_TOKEN'],
				message: 'is required when TURSO_URL is set'
			});
		}
		if (env.TURSO_TOKEN && !env.TURSO_URL) {
			ctx.addIssue({
				code: 'custom',
				path: ['TURSO_URL'],
				message: 'is required when TURSO_TOKEN is set'
			});
		}
	});

export type DatabaseConfig =
	| { kind: 'local'; url: string; dataDir: string }
	| { kind: 'turso'; url: string; authToken: string };

export type PokedexConfig = { path: string; required: boolean };

export type AppConfig = {
	database: DatabaseConfig;
	pokedex: PokedexConfig;
	auth: { secret?: string; dataDir: string };
};

/** Thrown when the environment is invalid. `message` lists every problem, one per line. */
export class ConfigError extends Error {
	override name = 'ConfigError';
}

/**
 * Validates the environment and builds the configuration.
 * @param env Environment variables (`process.env` in production, a plain object in tests).
 * @throws ConfigError with one line per invalid variable.
 */
export function loadConfig(env: Record<string, string | undefined>): AppConfig {
	// Empty strings (a common way to "unset" a variable in compose files) count as missing.
	const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== ''));
	const parsed = envSchema.safeParse(cleaned);
	if (!parsed.success) {
		const lines = parsed.error.issues.map(
			(i) => `- ${i.path.join('.') || 'environment'}: ${i.message}`
		);
		throw new ConfigError(`Invalid configuration:\n${lines.join('\n')}`);
	}
	const { DATA_DIR, TURSO_URL, TURSO_TOKEN, POKEDEX_PATH, NODE_ENV, AUTH_SECRET } = parsed.data;
	const pokedex = { path: POKEDEX_PATH, required: NODE_ENV === 'production' };
	const dir = DATA_DIR.replace(/\/+$/, '') || '/';
	const auth = { secret: AUTH_SECRET, dataDir: dir };
	if (TURSO_URL && TURSO_TOKEN) {
		return { database: { kind: 'turso', url: TURSO_URL, authToken: TURSO_TOKEN }, pokedex, auth };
	}
	return { database: { kind: 'local', url: `file:${dir}/app.db`, dataDir: dir }, pokedex, auth };
}
