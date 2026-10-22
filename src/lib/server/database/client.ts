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
	const db = drizzle(client, { schema });
	serializeTransactions(db);
	return { client, db };
}

/**
 * A transaction that starts while another is open gets a connection of its own without the busy
 * timeout, and fails at once with SQLITE_BUSY. The transactions of the app are short, so they
 * simply wait their turn: one at a time, in order. (Never open a transaction from inside another
 * through `db`: it would wait for itself; use the `tx` it was given.)
 */
function serializeTransactions(db: Database): void {
	const transaction = db.transaction.bind(db);
	let tail: Promise<unknown> = Promise.resolve();
	db.transaction = ((run, config) => {
		const result = tail.then(() => transaction(run, config));
		tail = result.catch(() => undefined);
		return result;
	}) as Database['transaction'];
}
