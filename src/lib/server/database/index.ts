import { building } from '$app/env';
import { loadConfig } from '../config';
import { openDatabase, type Connection } from './client';
import { purgeExpiredKeys } from './idempotency';
import { runMigrations } from './migrate';

export type { Database } from './client';

const PURGE_EVERY_MS = 60 * 60 * 1000;

let connection: Promise<Connection> | undefined;

/**
 * Opens the database, applies migrations and starts the hourly purge of idempotency keys.
 * Called once at startup; never while `npm run build` analyses the app.
 * @throws ConfigError or MigrationError: the app must not start.
 */
export function initDatabase(): Promise<Connection> {
	if (building) throw new Error('The database must not be opened during the build');
	connection ??= (async () => {
		const { database } = loadConfig(process.env);
		const opened = await openDatabase(database);
		await runMigrations(opened, database, process.env.MIGRATIONS_DIR ?? './drizzle');
		await purgeExpiredKeys(opened.db, Date.now());
		setInterval(() => void purgeExpiredKeys(opened.db, Date.now()), PURGE_EVERY_MS).unref();
		return opened;
	})();
	return connection;
}

/** The open database; `initDatabase` must have run (the server hook does it at startup). */
export function getDatabase(): Promise<Connection> {
	if (!connection) throw new Error('Database not initialised: call initDatabase() at startup');
	return connection;
}
