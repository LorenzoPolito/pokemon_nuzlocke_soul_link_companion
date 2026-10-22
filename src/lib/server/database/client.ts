import { mkdirSync } from 'node:fs';
import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import type { DatabaseConfig } from '../config';
import * as schema from './schema';

export type Database = LibSQLDatabase<typeof schema>;
export type Connection = { db: Database; client: Client };

/**
 * Opens the database described by the configuration. The same code serves the local
 * file and Turso: only the configuration differs.
 * Local files get WAL, foreign keys, a busy timeout and `synchronous = NORMAL`.
 */
export async function openDatabase(config: DatabaseConfig): Promise<Connection> {
	if (config.kind === 'local') mkdirSync(config.dataDir, { recursive: true });
	const client = createClient(
		config.kind === 'turso' ? { url: config.url, authToken: config.authToken } : { url: config.url }
	);
	if (config.kind === 'local') {
		await client.execute('PRAGMA journal_mode = WAL');
		await client.execute('PRAGMA synchronous = NORMAL');
		await client.execute('PRAGMA busy_timeout = 5000');
	}
	await client.execute('PRAGMA foreign_keys = ON');
	return { client, db: drizzle(client, { schema }) };
}
