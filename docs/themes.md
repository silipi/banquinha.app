# Storefront themes

A theme is **data**: a set of design tokens stored in the `themes` table. Nothing about a
specific theme lives in code paths that render it, so platform themes and themes made by
merchants (a future theme builder) go through the same pipeline.

```
themes.tokens (jsonb)          the theme's tokens
  + stores.theme_overrides     the store's own changes (e.g. its accent color)
  = resolveTheme()             API, src/themes/theme-tokens.ts
  → StorefrontStoreDto.theme   sent to the web app, already resolved
  → themeStyle()               web, src/lib/store-theme.ts → CSS variables
  → Tailwind utilities         bg-background, text-muted-foreground, bg-store,
                               text-store-foreground, rounded-store, rounded-store-sm …
```

## Tokens (version 1)

Defined and validated with zod in `apps/api/src/themes/theme-tokens.ts`.

| Token                     | What it paints                               | CSS variable                |
| ------------------------- | -------------------------------------------- | --------------------------- |
| `colors.background`       | Page background                              | `--background`              |
| `colors.surface`          | Cards, inputs, raised surfaces               | `--surface`                 |
| `colors.foreground`       | Main text                                    | `--foreground`              |
| `colors.muted`            | Quiet blocks, skeletons                      | `--muted`                   |
| `colors.mutedForeground`  | Secondary text                               | `--muted-foreground`        |
| `colors.border`           | Borders                                      | `--border`                  |
| `colors.accent`           | Buttons, highlights (`bg-store`)             | `--store-accent`            |
| `colors.accentForeground` | Text on the accent (`text-store-foreground`) | `--store-accent-foreground` |
| `radius`                  | `none` · `small` · `medium` · `large`        | `--store-radius(-sm)`       |

`--store-soft` (light tint of the accent) is derived in CSS, not stored.

## Adding a platform theme

1. Add an entry to `SYSTEM_THEMES` in `apps/api/src/themes/system-themes.ts` with a new,
   permanent `slug`. The array order is the display order; the first one is the default.
2. Deploy. The API upserts platform themes by slug on startup (`syncSystemThemes`), and
   the seed does the same. No migration and no web change are needed.

Editing an existing platform theme's tokens works the same way and restyles every store
using it (stores keep their overrides). Never reuse or rename a slug.

## Adding a token

1. Add it to `themeTokensSchema` (and to `themeOverridesSchema` if stores may override it).
   If old stored tokens can't satisfy the new shape, bump `version` and add a migration
   that rewrites `themes.tokens`.
2. Add it to every entry in `SYSTEM_THEMES` and to the DTO in `src/themes/dto/theme.dto.ts`;
   run `pnpm generate`.
3. Map it to a CSS variable in `themeStyle()` and use the variable in the storefront
   (register a Tailwind utility in `globals.css` under `@theme inline` if useful).

## Towards a theme builder

The schema already supports merchant themes: a `themes` row with `owner_id` set and no
`slug`. `ThemesService.findUsable()` lets a merchant apply platform themes their plan
includes (`required_plan`) and their own themes. A builder needs:

- an endpoint to create and update owned themes, validating input with `themeTokensSchema`;
- a plan check (paid plans only) and a limit on themes per account;
- contrast checks between `accent` and `accentForeground`, and `foreground` and `background`;
- the editor UI, which can reuse `StorePreview` (it renders any tokens).
