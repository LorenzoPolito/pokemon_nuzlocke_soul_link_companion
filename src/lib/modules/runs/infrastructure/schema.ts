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

/** A Soul Link group: one area/slot shared by all players in a run. */
export const linkGroup = sqliteTable(
	'link_group',
	{
		id: text('id').primaryKey(),
		runId: text('run_id')
			.notNull()
			.references(() => run.id, { onDelete: 'cascade' }),
		areaKey: text('area_key').notNull(),
		slot: text('slot', { enum: ['main', 'gift'] }).notNull(),
		status: text('status', { enum: ['open', 'linked', 'skipped', 'untracked'] })
			.notNull()
			.default('open'),
		position: text('position', { enum: ['team', 'box', 'dead'] }),
		version: integer('version').notNull().default(1),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(t) => [
		uniqueIndex('link_group_run_area_slot').on(t.runId, t.areaKey, t.slot),
		index('link_group_run_id').on(t.runId),
		check('link_group_slot', sql`${t.slot} in ('main', 'gift')`),
		check('link_group_status', sql`${t.status} in ('open', 'linked', 'skipped', 'untracked')`)
	]
);

export const encounter = sqliteTable(
	'encounter',
	{
		id: text('id').primaryKey(),
		runId: text('run_id')
			.notNull()
			.references(() => run.id, { onDelete: 'cascade' }),
		linkGroupId: text('link_group_id')
			.notNull()
			.references(() => linkGroup.id, { onDelete: 'cascade' }),
		memberId: text('member_id')
			.notNull()
			.references(() => runMember.id),
		specialKey: text('special_key'),
		attempt: integer('attempt').notNull().default(1),
		outcome: text('outcome', { enum: ['caught', 'failed', 'fled', 'dupe', 'untracked'] }).notNull(),
		speciesId: integer('species_id'),
		levelMet: integer('level_met'),
		version: integer('version').notNull().default(1),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(t) => [
		uniqueIndex('encounter_group_member_attempt').on(t.linkGroupId, t.memberId, t.attempt),
		uniqueIndex('encounter_group_member_valid')
			.on(t.linkGroupId, t.memberId)
			.where(sql`${t.outcome} <> 'dupe'`),
		index('encounter_run_id').on(t.runId),
		check(
			'encounter_outcome',
			sql`${t.outcome} in ('caught', 'failed', 'fled', 'dupe', 'untracked')`
		),
		check('encounter_level', sql`${t.levelMet} is null or ${t.levelMet} between 1 and 100`)
	]
);

export const specimen = sqliteTable(
	'specimen',
	{
		id: text('id').primaryKey(),
		runId: text('run_id')
			.notNull()
			.references(() => run.id, { onDelete: 'cascade' }),
		encounterId: text('encounter_id')
			.notNull()
			.unique()
			.references(() => encounter.id, { onDelete: 'cascade' }),
		memberId: text('member_id')
			.notNull()
			.references(() => runMember.id),
		linkGroupId: text('link_group_id')
			.notNull()
			.references(() => linkGroup.id, { onDelete: 'cascade' }),
		nickname: text('nickname').notNull(),
		speciesId: integer('species_id').notNull(),
		level: integer('level'),
		version: integer('version').notNull().default(1),
		createdAt: integer('created_at').notNull(),
		updatedAt: integer('updated_at').notNull()
	},
	(t) => [
		index('specimen_run_member').on(t.runId, t.memberId),
		check('specimen_nickname', sql`length(${t.nickname}) between 1 and 20`),
		check('specimen_level', sql`${t.level} is null or ${t.level} between 1 and 100`)
	]
);
