ALTER TABLE "stores" ALTER COLUMN "theme_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN "accent_color";