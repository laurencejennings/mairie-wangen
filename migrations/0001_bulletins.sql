CREATE TABLE `bulletins` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`year` integer NOT NULL,
	`issue_date` text NOT NULL,
	`description` text,
	`pdf_object_key` text NOT NULL,
	`file_name` text,
	`file_size` integer,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bulletins_published_issue_date` ON `bulletins` (`published`,`issue_date`);--> statement-breakpoint
CREATE INDEX `idx_bulletins_year_issue_date` ON `bulletins` (`year`,`issue_date`);
