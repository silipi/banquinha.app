DROP TABLE "login_codes" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;