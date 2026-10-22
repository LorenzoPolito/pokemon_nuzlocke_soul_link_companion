CREATE TABLE `run_event` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`actor_user_id` text,
	`type` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `run_event_run_id_id` ON `run_event` (`run_id`,`id`);