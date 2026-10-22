import { index, integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

/**
 * Idempotency keys of write requests (ADR 0002): a repeated request with the same key
 * returns the first response. Rows older than 24 hours are deleted.
 */
export const requestKey = sqliteTable(
	'request_key',
	{
		userId: text('user_id').notNull(),
		key: text('key').notNull(),
		/** SHA-256 of method, path and body: the same key with a different request is rejected. */
		requestHash: text('request_hash').notNull(),
		/** HTTP status of the stored response. */
		status: integer('status').notNull(),
		/** Body of the stored response (JSON text). */
		response: text('response').notNull(),
		createdAt: integer('created_at').notNull()
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.key] }),
		index('request_key_created_at').on(t.createdAt)
	]
);
