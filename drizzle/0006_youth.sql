CREATE TABLE `youth` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`side` text NOT NULL,
	`group` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youth_member_id_unique` ON `youth` (`member_id`);--> statement-breakpoint
CREATE TABLE `youth_breaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`label` text,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `youth_event_adults` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`present` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `youth_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youth_event_adults_member` ON `youth_event_adults` (`event_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `youth_event_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`side` text NOT NULL,
	`text` text,
	`leader_member_id` integer,
	`leader_group` text,
	`thought_member_id` integer,
	FOREIGN KEY (`event_id`) REFERENCES `youth_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`leader_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`thought_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youth_event_parts_side` ON `youth_event_parts` (`event_id`,`side`);--> statement-breakpoint
CREATE TABLE `youth_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`kind` text DEFAULT 'aktivitaet' NOT NULL,
	`joint` integer DEFAULT false NOT NULL,
	`details` text,
	`topic` text,
	`topic_url` text,
	`snack` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `youth_events_date_unique` ON `youth_events` (`date`);--> statement-breakpoint
CREATE TABLE `youth_ideas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`side` text NOT NULL,
	`note` text,
	`created_by` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`planned_event_id` integer,
	`dismissed_at` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`planned_event_id`) REFERENCES `youth_events`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `youth_leaders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
