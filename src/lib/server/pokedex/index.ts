import { existsSync } from 'node:fs';
import { createClient, type Client } from '@libsql/client';
import type { PokedexConfig } from '../config';
import { POKEDEX_SCHEMA_VERSION } from './schema';

export { POKEDEX_SCHEMA_VERSION } from './schema';

/** Where the Pokédex data come from, recorded in the file when it is generated. */
export type PokedexInfo = {
	schemaVersion: number;
	apiDataCommit: string;
	generatedAt: string;
};

export class PokedexError extends Error {
	override name = 'PokedexError';
}

export type Pokedex = { client: Client; info: PokedexInfo };

/**
 * Opens the Pokédex file for reading. The connection refuses every write (`query_only`);
 * in the container image the file is also read-only on disk.
 * @throws PokedexError when the file is missing, unreadable or has another schema version.
 */
export async function openPokedex(path: string): Promise<Pokedex> {
	if (!existsSync(path)) {
		throw new PokedexError(
			`Pokédex file not found at ${path}. Generate it with "npm run pokedex:fetch && npm run pokedex:build".`
		);
	}
	const client = createClient({ url: `file:${path}` });
	try {
		await client.execute('PRAGMA query_only = ON');
		const rows = await client.execute('SELECT key, value FROM meta');
		const meta = new Map(rows.rows.map((r) => [String(r.key), String(r.value)]));
		const schemaVersion = Number(meta.get('schema_version'));
		if (schemaVersion !== POKEDEX_SCHEMA_VERSION) {
			throw new PokedexError(
				`Pokédex schema version ${meta.get('schema_version') ?? 'unknown'} does not match the app (${POKEDEX_SCHEMA_VERSION}); regenerate the file.`
			);
		}
		return {
			client,
			info: {
				schemaVersion,
				apiDataCommit: meta.get('api_data_commit') ?? 'unknown',
				generatedAt: meta.get('generated_at') ?? 'unknown'
			}
		};
	} catch (error) {
		client.close();
		if (error instanceof PokedexError) throw error;
		throw new PokedexError(
			`Pokédex file at ${path} cannot be read: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Startup helper: opens the Pokédex or, outside production, returns `undefined` with a warning
 * so development works before the file is generated.
 */
export async function initPokedex(config: PokedexConfig): Promise<Pokedex | undefined> {
	try {
		return await openPokedex(config.path);
	} catch (error) {
		if (config.required || !(error instanceof PokedexError)) throw error;
		console.warn(`${error.message} The Pokédex is unavailable until it is generated.`);
		return undefined;
	}
}
