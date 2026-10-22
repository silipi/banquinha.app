# vendeu.store (monorepo)

Product context and decision history (pt-BR): `../CLAUDE.md`. This file covers **how the code is organized and how to work in it**.

## Layout

```
apps/web             Next.js 16 (App Router, Tailwind v4): landing, SEO, storefronts, merchant UI
apps/api             NestJS 12 + Fastify + Drizzle/Postgres: the backend (api.vendeu.store)
packages/api-client  Typed API client generated from the API's OpenAPI document
```

Tooling: **pnpm** workspaces + **Turborepo**. Everything is ESM (`"type": "module"`).

## Architecture rules

- **All business logic lives in `apps/api`.** Validation, calculations and decisions belong to Nest services. `apps/web` is frontend only: rendering, SEO, forms, UI state.
- The web never touches the database. It talks to the API through `@vendeu/api-client` (import from `@/lib/api`, which sets the base URL).
- The web may format input for UX (e.g. `formatStoreHandleInput`), but the API is the source of truth and returns the final value or a user-facing error message.

## Type sharing (API → web)

1. Controllers and DTO classes in the API are the contract. The `@nestjs/swagger` CLI plugin (`nest-cli.json`) reads TS types and JSDoc comments, so DTOs need no `@ApiProperty` boilerplate.
2. `pnpm generate` (root) builds the API, writes `apps/api/openapi.json` and regenerates `packages/api-client/src/generated` with `@hey-api/openapi-ts` (`client-next` + `sdk`).
3. Operation IDs are `<controller><Method>` (e.g. `StoresController.checkHandle` → `storesCheckHandle()`).
4. Both generated outputs are committed so contract changes show up in diffs. CI fails if they're stale. **Run `pnpm generate` after any API contract change.**
5. Never edit `src/generated` by hand.

Interactive API docs: `http://localhost:3333/docs` while the API runs.

## Commands (root)

```bash
pnpm install
pnpm db:up          # local Postgres via docker compose (Docker Desktop must be running)
pnpm dev            # api (:3333) + web (:3000)
pnpm generate       # API contract -> openapi.json -> typed client
pnpm check          # lint + typecheck + tests + prettier. Run before calling anything done.
pnpm format
pnpm db:generate    # create a migration from apps/api/src/database/schema
pnpm db:migrate
pnpm db:seed        # upsert the example stores (pauloplantas, luluca, clarajoias)
```

Env: copy `.env.example` to `.env` at the root. The API loads `../../.env` in dev and `next.config.ts` loads it for the web.

## Conventions

- **Language:** code, identifiers, comments, test names, commit messages and docs inside this repo are in **English**. Portuguese (pt-BR) is only for user-facing copy: UI text, error messages shown to users, metadata, emails.
- ESM relative imports use the `.js` extension in the API (`./stores.service.js`).
- Tests: `*.spec.ts` (unit) next to the code and `test/*.e2e-spec.ts` (HTTP via `app.inject`, using `createApp()` from `src/app.ts`).
- Prettier at the root (single quotes, trailing commas, Tailwind class sorting).

## Web (apps/web)

- Next 16 with `cacheComponents` and `partialPrefetching`. APIs differ from Next 13–15: read `apps/web/AGENTS.md` and `node_modules/next/dist/docs/` before using something new. Middleware is now called **proxy** (`src/proxy.ts`).
- Unstable values (`new Date()`, `Math.random()`) in Server Components break prerendering: use `'use cache'` + `cacheLife`, or move them to the client.
- Design tokens live in `src/app/globals.css` (`bg-ink`, `bg-brand`, `bg-sage`, `font-display`, ...). Use tokens, not ad-hoc colors.
- Base components in `src/components/ui` (shadcn style: `cva` + `cn`). Marketing routes in `src/app/(marketing)`.

## API (apps/api)

- Nest 12 on the Fastify adapter. `createApp()` in `src/app.ts` holds global setup (validation pipe) and is shared by `main.ts`, tests and `openapi.ts`.
- DTOs use `class-validator`; the global `ValidationPipe` runs with `whitelist` and `transform`.
- Drizzle client is injected with the `DB` token (`src/database/database.module.ts`); schema in `src/database/schema`.
- Env is validated with zod in `src/env.ts`.
- E2E tests run against a real Postgres: `test/support/global-setup.ts` creates `<db>_test`, migrates and seeds it. `pnpm db:up` must be running.

## Roadmap

Key idea: the storefront is built on the real data model from day one. The example stores (Paulo, Luluca, Clara) are **seed data in Postgres**, served by the API, so the landing links to live stores and the dashboard later writes to the same tables.

0. ✅ Foundation: monorepo, design system, landing (first pass), typed API client.
1. **Storefront + finished landing** (in parallel, now)
   - API: `stores`, `products`, `product_images`, `orders` tables; `GET /storefront/:handle`, `GET /storefront/:handle/products/:slug` (✅ done); seed with the 3 example stores (`pnpm db:seed`).
   - Web storefront (`/loja/[handle]`, later `<handle>.vendeu.store` via `proxy.ts`): header (logo, name, bio, WhatsApp/Instagram/location pills), product grid, product page, per-store accent color as a CSS variable (`bg-store`, `bg-store-soft`), "Feito com vendeu.store" badge (✅ pages done, `/loja/[handle]/produto/[slug]`; OG images and subdomain pending). Storefront URLs are built only in `src/lib/storefront-links.ts`; data comes from `src/lib/storefront.ts` (`'use cache'`, tagged `store:<handle>`).
   - Cart (client, per store, localStorage) → checkout form (name, delivery/pickup, note) → `POST /storefront/:handle/orders`: the API recomputes totals, saves the order and returns the WhatsApp message/link (✅ done: `orders`/`order_items`, cart in `use-cart.ts`, bag at `/loja/[handle]/sacola`, server action → API).
   - Landing: example stores link to the live storefronts, `/termos` + `/privacidade`, metadata/OG/sitemap/robots, mobile polish, Vercel Analytics.
2. **Merchant dashboard** → closed beta: auth (Google + e-mail), onboarding (handle → name → WhatsApp → logo/color), product CRUD with photos (R2), orders list (already recorded since phase 1), free-plan limits, PWA.
3. **Public launch**: open sign-up, transactional e-mails, error monitoring, rate limiting, deploy hardening (Vercel + Neon + R2).
4. **Payments**: Mercado Pago (Pix first, then card), order status, stock control.
5. **Growth**: paid plan + billing, shipping, digital products, analytics, custom domains, AI store assistant.
