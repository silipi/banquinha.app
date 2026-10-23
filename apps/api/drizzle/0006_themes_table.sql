CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"owner_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"required_plan" "plan" DEFAULT 'free' NOT NULL,
	"tokens" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "themes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "theme_id" uuid;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "theme_overrides" jsonb;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "themes_owner_idx" ON "themes" USING btree ("owner_id");--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Platform themes as they were at this migration; the API keeps them in sync with src/themes/system-themes.ts.
INSERT INTO "themes" ("slug", "name", "description", "required_plan", "position", "tokens") VALUES
('classico', 'Clássico', 'Fundo creme e laranja. Combina com tudo.', 'free', 0, '{"version":1,"colors":{"background":"#faf7f2","surface":"#ffffff","foreground":"#1a1714","muted":"#f1ece4","mutedForeground":"#6b645b","border":"#e6dfd4","accent":"#ff5a1f","accentForeground":"#ffffff"},"radius":"large"}'),
('jardim', 'Jardim', 'Verde e calmo, para plantas, comida natural e bem-estar.', 'free', 1, '{"version":1,"colors":{"background":"#f1f5ec","surface":"#ffffff","foreground":"#1b2117","muted":"#e2eada","mutedForeground":"#5c6a55","border":"#d3dec8","accent":"#4f7a3a","accentForeground":"#ffffff"},"radius":"large"}'),
('docinho', 'Docinho', 'Rosa e delicado, para doces, artesanato e presentes.', 'free', 2, '{"version":1,"colors":{"background":"#fcf4f7","surface":"#ffffff","foreground":"#2a1a21","muted":"#f6e4ec","mutedForeground":"#765f6a","border":"#edd5e0","accent":"#c2477a","accentForeground":"#ffffff"},"radius":"large"}')
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
-- Existing stores keep their look: the theme they had, and their accent color as an override.
UPDATE "stores" SET
  "theme_id" = (SELECT "id" FROM "themes" WHERE "themes"."slug" = COALESCE(NULLIF("stores"."theme", ''), 'classico')),
  "theme_overrides" = CASE
    WHEN "stores"."accent_color" <> (SELECT "tokens"->'colors'->>'accent' FROM "themes" WHERE "themes"."slug" = COALESCE(NULLIF("stores"."theme", ''), 'classico'))
    THEN jsonb_build_object('colors', jsonb_build_object('accent', "stores"."accent_color"))
    ELSE NULL
  END;
