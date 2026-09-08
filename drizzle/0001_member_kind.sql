ALTER TABLE `members` ADD `kind` text DEFAULT 'gemeinde' NOT NULL;--> statement-breakpoint
ALTER TABLE `members` ADD `calling` text;--> statement-breakpoint
UPDATE `members` SET `kind` = 'pfahl', `calling` = `affiliation`, `affiliation` = NULL WHERE `affiliation` IN ('Hoherat', 'Pfahlpräsidentschaft', 'Tempelpräsidentschaft', 'Missionspräsidentschaft');
