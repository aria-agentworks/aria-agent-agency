ALTER TABLE `store_inquiries` ADD `supportOption` enum('scope-only','installation','installation-api','managed-api');--> statement-breakpoint
ALTER TABLE `store_inquiries` ADD `location` varchar(180);--> statement-breakpoint
ALTER TABLE `store_inquiries` ADD `country` varchar(120);--> statement-breakpoint
ALTER TABLE `store_inquiries` ADD `timezone` varchar(100);--> statement-breakpoint
ALTER TABLE `store_inquiries` ADD `languages` varchar(250);--> statement-breakpoint
ALTER TABLE `store_inquiries` ADD `ownerRole` varchar(160);--> statement-breakpoint
ALTER TABLE `store_inquiries` ADD `apiProviders` varchar(2000);