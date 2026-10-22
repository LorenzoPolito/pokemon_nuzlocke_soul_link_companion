import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/libsql/migrator';
import type { DatabaseConfig } from '../config';
import type { Connection } from './client';

export class MigrationError extends Error {
	override name = 'MigrationError';
}

/** Number of migrations already applied (0 on a new database). */
async function appliedCount({ client }: Connection): Promise<number> {
	const table = await client.execute(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'"
	);
	if (table.rows.length === 0) return 0;
	const rows = await client.execute('SELECT COUNT(*) AS n FROM __drizzle_migrations');
	return Number(rows.rows[0]?.n ?? 0);
}

/** Number of migrations shipped with the app (entries of the Drizzle journal). */
function shippedCount(migrationsFolder: string): number {
	const journal = JSON.parse(readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8'));
	return Array.isArray(journal.entries) ? journal.entries.length : 0;
}

/**
 * Applies pending migrations (forward only). On a local database that already has data,
 * a copy of the file (`app.db.before-migration`) is made before the pending migrations run.
 * @throws MigrationError with a clear message; the caller must stop the app.
 */
export async function runMigrations(
	connection: Connection,
	config: DatabaseConfig,
	migrationsFolder: string
): Promise<void> {
	try {
		const applied = await appliedCount(connection);
		if (config.kind === 'local' && applied > 0 && applied < shippedCount(migrationsFolder)) {
			const dbFile = config.url.slice('file:'.length);
			if (existsSync(dbFile)) {
				await connection.client.execute('PRAGMA wal_checkpoint(TRUNCATE)');
				copyFileSync(dbFile, `${dbFile}.before-migration`);
			}
		}
		await migrate(connection.db, { migrationsFolder });
	} catch (cause) {
		const reason = cause instanceof Error ? cause.message : String(cause);
		throw new MigrationError(
			`Database migration failed, the app cannot start. Nothing was changed after the failing step: ${reason}`,
			{ cause }
		);
	}
}
