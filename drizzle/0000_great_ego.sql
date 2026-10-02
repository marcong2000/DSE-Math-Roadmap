CREATE TABLE `progress` (
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`status` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `topic_id`)
);
