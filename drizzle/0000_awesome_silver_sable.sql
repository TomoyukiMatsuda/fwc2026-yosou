CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text,
	`payload` text NOT NULL,
	`champion_team_id` text NOT NULL,
	`score` integer,
	`scored_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pred_score` ON `predictions` (`score`);