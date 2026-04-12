ALTER TABLE "users" ADD COLUMN "billing_interval" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "domain_removed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_failed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_cancel_at" timestamp;