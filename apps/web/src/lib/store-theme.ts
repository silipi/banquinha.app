import type { ThemeTokensDto } from '@banquinha/api-client';
import type { CSSProperties } from 'react';

// Card/image corners and smaller corners (inputs, thumbnails) for each radius token.
const RADII: Record<ThemeTokensDto['radius'], [string, string]> = {
  none: ['0px', '0px'],
  small: ['0.5rem', '0.375rem'],
  medium: ['1rem', '0.75rem'],
  large: ['1.5rem', '1rem'],
};

/**
 * Turns a theme's design tokens into CSS variables. Put it on the element that also has
 * the `storefront` class: everything inside (Tailwind's bg-background, text-muted-
 * foreground, bg-store, rounded-store...) then follows the theme. Works for any theme,
 * including ones made by merchants, because nothing is hardcoded per theme.
 */
export function themeStyle(tokens: ThemeTokensDto): CSSProperties {
  const { colors } = tokens;
  const [radius, radiusSm] = RADII[tokens.radius];
  return {
    '--background': colors.background,
    '--surface': colors.surface,
    '--foreground': colors.foreground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--border': colors.border,
    '--store-accent': colors.accent,
    '--store-accent-foreground': colors.accentForeground,
    '--store-radius': radius,
    '--store-radius-sm': radiusSm,
  } as CSSProperties;
}
