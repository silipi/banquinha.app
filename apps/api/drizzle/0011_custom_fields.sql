CREATE TYPE "public"."field_type" AS ENUM('text', 'number', 'choice', 'boolean');--> statement-breakpoint
CREATE TABLE "store_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" "field_type" NOT NULL,
	"unit" text,
	"options" jsonb,
	"show_on_card" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "store_fields" ADD CONSTRAINT "store_fields_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_fields_store_idx" ON "store_fields" USING btree ("store_id");