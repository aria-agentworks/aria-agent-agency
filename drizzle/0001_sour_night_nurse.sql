CREATE TABLE `store_inquiries` (
	`id` varchar(32) NOT NULL,
	`reference` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320) NOT NULL,
	`business` varchar(200) NOT NULL,
	`industry` varchar(120) NOT NULL,
	`automation` varchar(160) NOT NULL,
	`tools` text NOT NULL,
	`goals` text NOT NULL,
	`phone` varchar(64),
	`website` varchar(512),
	`consent` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `store_inquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_inquiries_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `store_orders` (
	`id` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`items` text NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
	`customerName` text,
	`customerEmail` varchar(320),
	`stripeSessionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_orders_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);
--> statement-breakpoint
CREATE TABLE `store_purchases` (
	`id` varchar(32) NOT NULL,
	`orderId` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`items` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `store_purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_purchases_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `stripe_events` (
	`id` varchar(255) NOT NULL,
	`type` varchar(120) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stripe_events_id` PRIMARY KEY(`id`)
);
