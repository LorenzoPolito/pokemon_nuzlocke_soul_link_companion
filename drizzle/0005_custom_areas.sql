CREATE TABLE `custom_area` (`id` text PRIMARY KEY NOT NULL, `game_id` text NOT NULL, `name` text NOT NULL, `after_area_key` text, `created_at` integer NOT NULL, `updated_at` integer NOT NULL, `archived_at` integer);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_area_game_name` ON `custom_area` (`game_id`,`name`);
--> statement-breakpoint
CREATE INDEX `custom_area_game_order` ON `custom_area` (`game_id`,`after_area_key`,`created_at`);
--> statement-breakpoint
CREATE INDEX `custom_area_archived_at` ON `custom_area` (`archived_at`);
