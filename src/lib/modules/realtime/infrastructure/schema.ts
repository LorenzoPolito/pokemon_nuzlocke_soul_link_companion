import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * The diary of a run: every change, in order. The id (UUIDv7) is the event id of the stream,
 * so a reconnecting client asks for "what came after id X".
 * `run_id` becomes a foreign key and the append-only triggers are added with the run tables (phase 4).
 */
export const runEvent = sqliteTable(
	'run_event',
	{
		id: text('id').primaryKey(),
		runId: text('run_id').notNull(),
		actorUserId: text('actor_user_id'),
		type: text('type').notNull(),
		entity: text('entity').notNull(),
		entityId: text('entity_id').notNull(),
		/** JSON: `{ before, after }` and the entities changed. */
		payload: text('payload').notNull(),
		createdAt: integer('created_at').notNull()
	},
	(t) => [index('run_event_run_id_id').on(t.runId, t.id)]
);
