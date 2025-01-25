CREATE TABLE `todos` (
	`id` integer PRIMARY KEY NOT NULL,
	`content` text
);
--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `name`;