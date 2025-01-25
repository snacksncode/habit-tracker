PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_habits` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`text` text,
	`status` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_habits`("id", "user_id", "text", "status") SELECT "id", "user_id", "text", "status" FROM `habits`;--> statement-breakpoint
DROP TABLE `habits`;--> statement-breakpoint
ALTER TABLE `__new_habits` RENAME TO `habits`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_substasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`task_id` integer NOT NULL,
	`text` text,
	`status` integer DEFAULT 0,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_substasks`("id", "task_id", "text", "status") SELECT "id", "task_id", "text", "status" FROM `substasks`;--> statement-breakpoint
DROP TABLE `substasks`;--> statement-breakpoint
ALTER TABLE `__new_substasks` RENAME TO `substasks`;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`text` text,
	`status` integer DEFAULT 0,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "user_id", "text", "status") SELECT "id", "user_id", "text", "status" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;