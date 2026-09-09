ALTER TABLE `meetings` ADD `guest_member_id` integer REFERENCES members(id);--> statement-breakpoint
ALTER TABLE `meetings` ADD `chair_member_id` integer REFERENCES members(id);--> statement-breakpoint
ALTER TABLE `stake_callings` ADD `presides` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `stake_callings` SET `presides` = true WHERE `name` LIKE '%Pfahlpräsident%';
