import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from '../../auth/infrastructure/schema';

/** A run (docs/progetto/06, "run"). Dates are milliseconds since the epoch (UTC). */
export const run = sqliteTable(
	'run',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id),
		/** A version (`black`, `white`, `black-2`, `white-2`); it does not change after the first encounter. */
		gameId: text('game_id').notNull(),
		gameDataVersion: text('game_data_version').notNull(),
		status: text('status', { enum: ['active', 'lost', 'completed'] })
			.notNull()
			.default('active'),
		/** JSON, validated with Zod; `settings_schema` is the version of the document. */
		settings: text('settings').notNull(),
		settingsSchema: integer('settings_schema').notNull(),
		startedInProgress: integer('started_in_progress', { mode: 'boolean' }).notNull().default(false),
		levelCapOverride: integer('level_cap_override'),
		/** JSON: why a lost run was lost. */
		endInfo: text('end_info'),
		endedAt: integer('ended_at'),
		deletedAt: integer('deleted_at'),
		version: integer('version').notNull().default(1),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(t) => [
		check('run_status', sql`${t.status} in ('active', 'lost', 'completed')`),
		check('run_name_length', sql`length(${t.name}) between 1 and 60`),
		check(
			'run_level_cap_override',
			sql`${t.levelCapOverride} is null or ${t.levelCapOverride} between 1 and 100`
		),
		index('run_deleted_at').on(t.deletedAt),
		index('run_owner_id').on(t.ownerId)
	]
);

/**
 * Who takes part in a run. `user_id` is NULL for a pending seat (an invited person who has not
 * accepted yet, P4-02); a spectator has no seat.
 */
export const runMember = sqliteTable(
	'run_member',
	{
		id: text('id').primaryKey(),
		runId: text('run_id')
			.notNull()
			.references(() => run.id, { onDelete: 'cascade' }),
		userId: text('user_id').references(() => user.id),
		displayName: text('display_name'),
		role: text('role', { enum: ['owner', 'player', 'spectator'] }).notNull(),
		seat: integer('seat'),
		/**
		 * Set when the person was removed or left: the row stays so that their data (encounters,
		 * specimens, milestones) keep their author, but they no longer see or follow the run.
		 */
		removedAt: integer('removed_at'),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(t) => [
		check('run_member_role', sql`${t.role} in ('owner', 'player', 'spectator')`),
		check(
			'run_member_display_name',
			sql`${t.displayName} is null or length(${t.displayName}) between 1 and 40`
		),
		uniqueIndex('run_member_run_user').on(t.runId, t.userId),
		uniqueIndex('run_member_one_owner')
			.on(t.runId)
			.where(sql`${t.role} = 'owner'`),
		uniqueIndex('run_member_run_seat')
			.on(t.runId, t.seat)
			.where(sql`${t.seat} is not null`),
		index('run_member_user_id').on(t.userId)
	]
);
