import type { PlanId } from '../plans/plans.js';
import type { ThemeTokens } from './theme-tokens.js';

export interface SystemTheme {
  /** Stable id across environments; never change it once released. */
  slug: string;
  name: string;
  description: string;
  /** Lowest plan that can use it. */
  requiredPlan: PlanId;
  tokens: ThemeTokens;
}

/**
 * Themes offered by the platform, in display order. Synced to the `themes` table when
 * the API starts (sync-system-themes.ts): to add one, add an entry here and deploy.
 * The first one is the default for new stores.
 */
export const SYSTEM_THEMES: SystemTheme[] = [
  {
    slug: 'classico',
    name: 'Clássico',
    description: 'Fundo creme e laranja. Combina com tudo.',
    requiredPlan: 'free',
    tokens: {
      version: 1,
      colors: {
        background: '#faf7f2',
        surface: '#ffffff',
        foreground: '#1a1714',
        muted: '#f1ece4',
        mutedForeground: '#6b645b',
        border: '#e6dfd4',
        accent: '#ff5a1f',
        accentForeground: '#ffffff',
      },
      radius: 'large',
    },
  },
  {
    slug: 'jardim',
    name: 'Jardim',
    description: 'Verde e calmo, para plantas, comida natural e bem-estar.',
    requiredPlan: 'free',
    tokens: {
      version: 1,
      colors: {
        background: '#f1f5ec',
        surface: '#ffffff',
        foreground: '#1b2117',
        muted: '#e2eada',
        mutedForeground: '#5c6a55',
        border: '#d3dec8',
        accent: '#4f7a3a',
        accentForeground: '#ffffff',
      },
      radius: 'large',
    },
  },
  {
    slug: 'docinho',
    name: 'Docinho',
    description: 'Rosa e delicado, para doces, artesanato e presentes.',
    requiredPlan: 'free',
    tokens: {
      version: 1,
      colors: {
        background: '#fcf4f7',
        surface: '#ffffff',
        foreground: '#2a1a21',
        muted: '#f6e4ec',
        mutedForeground: '#765f6a',
        border: '#edd5e0',
        accent: '#c2477a',
        accentForeground: '#ffffff',
      },
      radius: 'large',
    },
  },
];

export const DEFAULT_THEME_SLUG = SYSTEM_THEMES[0]!.slug;
