import {
  BadRequestException,
  Inject,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { asc, eq, isNull } from 'drizzle-orm';
import type { AuthUser } from '../auth/current-user.decorator.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { themes } from '../database/schema/index.js';
import { planIncludes } from '../plans/plans.js';
import type { ThemeDto } from './dto/theme.dto.js';
import { syncSystemThemes } from './sync-system-themes.js';
import { DEFAULT_THEME_SLUG } from './system-themes.js';

type ThemeRow = typeof themes.$inferSelect;

export const toThemeDto = (theme: ThemeRow): ThemeDto => ({
  id: theme.id,
  slug: theme.slug,
  name: theme.name,
  description: theme.description,
  requiredPlan: theme.requiredPlan,
  tokens: theme.tokens,
});

@Injectable()
export class ThemesService implements OnModuleInit {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Keeps the platform themes in the database equal to system-themes.ts. */
  async onModuleInit() {
    await syncSystemThemes(this.db);
  }

  /** Platform themes, in display order. */
  async listPlatform(): Promise<ThemeDto[]> {
    const rows = await this.db
      .select()
      .from(themes)
      .where(isNull(themes.ownerId))
      .orderBy(asc(themes.position), asc(themes.createdAt));
    return rows.map(toThemeDto);
  }

  /**
   * A theme this merchant may apply: a platform theme their plan includes, or one of
   * their own. Defaults to the first platform theme when no id is given.
   */
  async findUsable(user: AuthUser, themeId?: string): Promise<ThemeRow> {
    const [theme] = await this.db
      .select()
      .from(themes)
      .where(
        themeId ? eq(themes.id, themeId) : eq(themes.slug, DEFAULT_THEME_SLUG),
      )
      .limit(1);
    const usable =
      theme &&
      (theme.ownerId === user.id ||
        (theme.ownerId === null &&
          planIncludes(user.plan, theme.requiredPlan)));
    if (!usable) throw new BadRequestException('Escolha um dos temas');
    return theme;
  }
}
