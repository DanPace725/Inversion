CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`session` text NOT NULL,
	`groups` text DEFAULT '[]' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`session` text NOT NULL,
	`medium` text NOT NULL,
	`image_key` text,
	`digest` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`draft` text DEFAULT '' NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`warnings` text DEFAULT '[]' NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`permission` integer DEFAULT 0 NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`lease` text
);
--> statement-breakpoint
CREATE INDEX `responses_owner_session` ON `responses` (`owner`,`session`);--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`session` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL
);
