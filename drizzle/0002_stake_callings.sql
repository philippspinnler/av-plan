CREATE TABLE `stake_callings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stake_callings_name_unique` ON `stake_callings` (`name`);--> statement-breakpoint
ALTER TABLE `members` ADD `stake_calling_id` integer REFERENCES stake_callings(id);--> statement-breakpoint
INSERT INTO `stake_callings` (`name`, `position`) VALUES ('Pfahlpräsident', 1), ('1. Ratgeber Pfahlpräsidentschaft', 2), ('2. Ratgeber Pfahlpräsidentschaft', 3), ('Hoherat', 4), ('Missionspräsident', 5);--> statement-breakpoint
INSERT INTO `stake_callings` (`name`, `position`) SELECT DISTINCT `calling`, 100 FROM `members` WHERE `calling` IS NOT NULL AND `calling` <> '' AND `calling` NOT IN (SELECT `name` FROM `stake_callings`);--> statement-breakpoint
UPDATE `members` SET `stake_calling_id` = (SELECT `id` FROM `stake_callings` WHERE `stake_callings`.`name` = `members`.`calling`) WHERE `calling` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `members` DROP COLUMN `calling`;