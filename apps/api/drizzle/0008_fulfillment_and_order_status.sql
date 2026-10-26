CREATE TYPE "public"."order_status" AS ENUM('new', 'confirmed', 'completed', 'canceled');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "status" "order_status" DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "pickup_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "delivery_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_store_status_idx" ON "orders" USING btree ("store_id","status");