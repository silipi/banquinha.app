CREATE TYPE "public"."day_period" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('product', 'service');--> statement-breakpoint
CREATE TYPE "public"."price_type" AS ENUM('fixed', 'hourly', 'daily', 'from', 'quote');--> statement-breakpoint
ALTER TYPE "public"."fulfillment_method" ADD VALUE 'online';--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "unit_price_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "kind" "item_kind" DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "price_type" "price_type" DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "price_to_confirm" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "preferred_date" date;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "preferred_period" "day_period";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "kind" "item_kind" DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_type" "price_type" DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "online_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "service_area" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_check" CHECK ("products"."price_cents" is not null or "products"."price_type" = 'quote');