import { sql } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { themes } from '../database/schema/index.js';
import { SYSTEM_THEMES } from './system-themes.js';
import { themeTokensSchema } from './theme-tokens.js';

/** Upserts the platform themes from code by slug. Idempotent; runs on API start and in seeds. */
export async function syncSystemThemes(db: Db): Promise<void> {
  await db
    .insert(themes)
    .values(
      SYSTEM_THEMES.map((theme, position) => ({
        slug: theme.slug,
        name: theme.name,
        description: theme.description,
        requiredPlan: theme.requiredPlan,
        // Fails fast on a typo in system-themes.ts instead of storing broken tokens.
        tokens: themeTokensSchema.parse(theme.tokens),
        position,
      })),
    )
    .onConflictDoUpdate({
      target: themes.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        requiredPlan: sql`excluded.required_plan`,
        tokens: sql`excluded.tokens`,
        position: sql`excluded.position`,
        updatedAt: new Date(),
      },
    });
}
