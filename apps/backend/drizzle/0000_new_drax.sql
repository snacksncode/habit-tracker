CREATE TABLE `habits` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`to_complete` integer DEFAULT 1 NOT NULL,
	`status` integer DEFAULT 0 NOT NULL,
	`freq` text DEFAULT 'DAILY' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`is_completed` integer DEFAULT false,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`avatar_id` integer DEFAULT 1,
	`health` integer DEFAULT 0 NOT NULL,
	`experience` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);