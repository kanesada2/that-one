CREATE TABLE `movies` (
	`id` integer PRIMARY KEY NOT NULL,
	`c_quality` real NOT NULL,
	`risk` real NOT NULL,
	`download` integer DEFAULT 0 NOT NULL,
	`popularity` real DEFAULT 0 NOT NULL,
	`deleted_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`movie_id` integer NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`frequency` real NOT NULL,
	`start_rank` integer NOT NULL,
	`explores_desc` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_movie_unq` ON `downloads` (`user_id`,`movie_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `downloads` (`created_at`);--> statement-breakpoint
CREATE INDEX `start_rank_index` ON `users` (`start_rank`);