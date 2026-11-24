CREATE TABLE `link_group` (
  `id` text PRIMARY KEY NOT NULL,
  `run_id` text NOT NULL REFERENCES `run`(`id`) ON DELETE cascade,
  `area_key` text NOT NULL,
  `slot` text NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `position` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `died_at` integer,
  `death_cause` text,
  `version` integer DEFAULT 1 NOT NULL,
  CONSTRAINT `link_group_slot` CHECK (`slot` in ('main', 'gift')),
  CONSTRAINT `link_group_status` CHECK (`status` in ('open', 'linked', 'skipped', 'untracked')),
  CONSTRAINT `link_group_linked_position` CHECK ((`status` = 'linked') = (`position` is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_group_run_area_slot` ON `link_group` (`run_id`, `area_key`, `slot`);
--> statement-breakpoint
CREATE INDEX `link_group_run_id` ON `link_group` (`run_id`);
--> statement-breakpoint
CREATE TABLE `encounter` (
  `id` text PRIMARY KEY NOT NULL,
  `run_id` text NOT NULL REFERENCES `run`(`id`) ON DELETE cascade,
  `link_group_id` text NOT NULL REFERENCES `link_group`(`id`) ON DELETE cascade,
  `member_id` text NOT NULL REFERENCES `run_member`(`id`),
  `special_key` text,
  `attempt` integer DEFAULT 1 NOT NULL,
  `outcome` text NOT NULL,
  `species_id` integer,
  `level_met` integer,
  `version` integer DEFAULT 1 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  CONSTRAINT `encounter_outcome` CHECK (`outcome` in ('caught', 'failed', 'fled', 'dupe', 'untracked')),
  CONSTRAINT `encounter_species` CHECK (`outcome` in ('caught', 'dupe') = (`species_id` is not null)),
  CONSTRAINT `encounter_level` CHECK (`level_met` is null or `level_met` between 1 and 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `encounter_group_member_attempt` ON `encounter` (`link_group_id`, `member_id`, `attempt`);
--> statement-breakpoint
CREATE UNIQUE INDEX `encounter_group_member_valid` ON `encounter` (`link_group_id`, `member_id`) WHERE `outcome` <> 'dupe';
--> statement-breakpoint
CREATE INDEX `encounter_run_id` ON `encounter` (`run_id`);
--> statement-breakpoint
CREATE INDEX `encounter_member_id` ON `encounter` (`member_id`);
--> statement-breakpoint
CREATE TABLE `specimen` (
  `id` text PRIMARY KEY NOT NULL,
  `run_id` text NOT NULL REFERENCES `run`(`id`) ON DELETE cascade,
  `encounter_id` text NOT NULL REFERENCES `encounter`(`id`) ON DELETE cascade,
  `member_id` text NOT NULL REFERENCES `run_member`(`id`),
  `link_group_id` text NOT NULL REFERENCES `link_group`(`id`) ON DELETE cascade,
  `nickname` text NOT NULL,
  `species_id` integer NOT NULL,
  `variety_id` integer,
  `level` integer,
  `version` integer DEFAULT 1 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  CONSTRAINT `specimen_nickname` CHECK (length(`nickname`) between 1 and 20),
  CONSTRAINT `specimen_level` CHECK (`level` is null or `level` between 1 and 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `specimen_encounter` ON `specimen` (`encounter_id`);
--> statement-breakpoint
CREATE INDEX `specimen_member_id` ON `specimen` (`member_id`);
