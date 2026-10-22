CREATE TABLE `run` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_id` text NOT NULL,
	`game_id` text NOT NULL,
	`game_data_version` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`settings` text NOT NULL,
	`settings_schema` integer NOT NULL,
	`started_in_progress` integer DEFAULT false NOT NULL,
	`level_cap_override` integer,
	`end_info` text,
	`ended_at` integer,
	`deleted_at` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "run_status" CHECK("run"."status" in ('active', 'lost', 'completed')),
	CONSTRAINT "run_name_length" CHECK(length("run"."name") between 1 and 60),
	CONSTRAINT "run_level_cap_override" CHECK("run"."level_cap_override" is null or "run"."level_cap_override" between 1 and 100)
);
--> statement-breakpoint
CREATE INDEX `run_deleted_at` ON `run` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `run_owner_id` ON `run` (`owner_id`);--> statement-breakpoint
CREATE TABLE `run_member` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`user_id` text,
	`display_name` text,
	`role` text NOT NULL,
	`seat` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `run`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "run_member_role" CHECK("run_member"."role" in ('owner', 'player', 'spectator')),
	CONSTRAINT "run_member_display_name" CHECK("run_member"."display_name" is null or length("run_member"."display_name") between 1 and 40)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `run_member_run_user` ON `run_member` (`run_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `run_member_one_owner` ON `run_member` (`run_id`) WHERE "run_member"."role" = 'owner';--> statement-breakpoint
CREATE UNIQUE INDEX `run_member_run_seat` ON `run_member` (`run_id`,`seat`) WHERE "run_member"."seat" is not null;--> statement-breakpoint
CREATE INDEX `run_member_user_id` ON `run_member` (`user_id`);