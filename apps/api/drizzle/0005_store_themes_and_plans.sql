CREATE TYPE "public"."plan" AS ENUM('free');--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "theme" text DEFAULT 'classico' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" "plan" DEFAULT 'free' NOT NULL;