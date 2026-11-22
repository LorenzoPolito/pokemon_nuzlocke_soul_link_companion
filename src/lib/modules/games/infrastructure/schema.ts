import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const customArea = sqliteTable(
	'custom_area',
	{
		id: text('id').primaryKey(),
		gameId: text('game_id').notNull(),
		name: text('name').notNull(),
		afterAreaKey: text('after_area_key'),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull(),
		archivedAt: integer('archived_at')
	},
	(t) => [
		uniqueIndex('custom_area_game_name').on(t.gameId, t.name),
		index('custom_area_game_order').on(t.gameId, t.afterAreaKey, t.createdAt),
		index('custom_area_archived_at').on(t.archivedAt)
	]
);
