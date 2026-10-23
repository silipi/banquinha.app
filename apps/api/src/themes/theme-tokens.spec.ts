import { SYSTEM_THEMES } from './system-themes.js';
import { resolveTheme, themeTokensSchema } from './theme-tokens.js';

describe('theme tokens', () => {
  it.each(SYSTEM_THEMES.map((t) => [t.slug, t]))(
    'platform theme %s has valid tokens',
    (_slug, theme) => {
      expect(() => themeTokensSchema.parse(theme.tokens)).not.toThrow();
    },
  );

  it('has unique platform theme slugs', () => {
    const slugs = SYSTEM_THEMES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('applies store overrides on top of the theme', () => {
    const base = SYSTEM_THEMES[0]!.tokens;
    const resolved = resolveTheme(base, {
      colors: { accent: '#123456' },
      radius: 'none',
    });
    expect(resolved.colors.accent).toBe('#123456');
    expect(resolved.colors.background).toBe(base.colors.background);
    expect(resolved.radius).toBe('none');
    expect(resolveTheme(base, null)).toEqual(base);
  });

  it('rejects colors that are not #rrggbb', () => {
    const base = SYSTEM_THEMES[0]!.tokens;
    expect(() =>
      themeTokensSchema.parse({
        ...base,
        colors: { ...base.colors, accent: 'red' },
      }),
    ).toThrow();
  });
});
