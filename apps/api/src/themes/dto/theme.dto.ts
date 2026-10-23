import type { PlanId } from '../../plans/plans.js';
import type { ThemeTokens } from '../theme-tokens.js';

/** Hex colors (#rrggbb). See src/themes/theme-tokens.ts for what each one paints. */
export class ThemeColorsDto {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  accent: string;
  accentForeground: string;
}

/** Design tokens the web app turns into CSS variables. */
export class ThemeTokensDto implements ThemeTokens {
  version: 1;
  colors: ThemeColorsDto;
  radius: 'none' | 'small' | 'medium' | 'large';
}

export class ThemeDto {
  id: string;
  /** Set for platform themes. */
  slug: string | null;
  name: string;
  description: string | null;
  /** Lowest plan that can use it. */
  requiredPlan: PlanId;
  tokens: ThemeTokensDto;
}
