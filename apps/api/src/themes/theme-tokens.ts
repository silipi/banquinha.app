import { z } from 'zod';

// Design tokens: everything a theme can change, as data. A store's look is its theme's
// tokens with the store's own overrides on top. The web app turns tokens into CSS
// variables, so a new theme (or one made in a future theme builder) needs no code.
// Bump `version` and migrate stored tokens when the shape changes.

const hexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, 'Use uma cor no formato #rrggbb');

export const THEME_RADII = ['none', 'small', 'medium', 'large'] as const;

const themeColorsSchema = z.object({
  /** Page background. */
  background: hexColor,
  /** Cards, inputs and other raised surfaces. */
  surface: hexColor,
  /** Main text. */
  foreground: hexColor,
  /** Placeholders and quiet blocks. */
  muted: hexColor,
  /** Secondary text. */
  mutedForeground: hexColor,
  border: hexColor,
  /** Buttons and highlights. */
  accent: hexColor,
  /** Text on top of the accent color. */
  accentForeground: hexColor,
});

export const themeTokensSchema = z.object({
  version: z.literal(1),
  colors: themeColorsSchema,
  /** Corner roundness of cards, images and buttons. */
  radius: z.enum(THEME_RADII),
});

/** What a store may change on top of its theme. */
export const themeOverridesSchema = z.object({
  colors: themeColorsSchema.partial().optional(),
  radius: z.enum(THEME_RADII).optional(),
});

export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type ThemeOverrides = z.infer<typeof themeOverridesSchema>;

/** The tokens a store actually renders with. */
export function resolveTheme(
  tokens: ThemeTokens,
  overrides: ThemeOverrides | null | undefined,
): ThemeTokens {
  return {
    ...tokens,
    colors: { ...tokens.colors, ...overrides?.colors },
    radius: overrides?.radius ?? tokens.radius,
  };
}
