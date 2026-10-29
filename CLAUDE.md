# banquinha.app (monorepo)

Product context and decisions come first (in pt-BR, for the owner); the rest covers **how the code is organized and how to work in it**.

## Produto

Plataforma brasileira para criar uma loja online simples em minutos e vender por um link único (bio do Instagram, WhatsApp, TikTok). Um "Shopify pequeno" adaptado ao Brasil; inspiração de UX: [tiny.store](https://tiny.store) (mobile-first, setup em 3 passos, vitrine com avatar + nome + bio + botões-pílula + grid de produtos).

- **Público:** quem hoje vende ou presta serviço pelo Instagram/WhatsApp e não sabe programar. Foco em autônomos: marmiteira, manicure, revendedora, marido de aluguel, diarista, professor.
- **Promessa:** loja pronta em menos de 10 minutos, gerenciada do celular.
- **O que a plataforma oferece (ou vai oferecer):** vitrine personalizável (temas, cores, logo) em `banquinha.app/<loja>`; catálogo de produtos e serviços com fotos; carrinho e pedido; painel de pedidos e clientes; mais tarde estoque, analytics, notificações, assistente que guia a criação da loja e domínio próprio.
- **Planos:** grátis com limite + pago (valores a definir).
- **Idioma:** produto, copies e textos de UI em português do Brasil. Código, comentários, testes e docs técnicas em inglês. `ROADMAP.md` e este bloco ficam em pt-BR.

## Decisões de produto

- **Checkout:** no MVP o pedido vai para o WhatsApp do lojista, e o pós-venda segue por lá. Pix, cartão e boleto via Mercado Pago entram numa fase seguinte, com o dinheiro direto na conta do lojista.
- **Sem app nativo** por enquanto: web mobile-first instalável (PWA).
- **Toda regra de negócio na API** (NestJS, escolhido por convenção forte e porque o dono já conhece Nest, para manter sem IA). O Next.js é só frontend.
- **Hospedagem em São Paulo** para a vitrine não atravessar continentes: Vercel, Cloud Run `southamerica-east1`, Neon `aws-sa-east-1`, Cloudflare R2. Postgres padrão para poder migrar. Home server (Coolify) e Fly.io foram descartados para produção.
- **Domínio:** `banquinha.app` (DNS no Cloudflare). Área do lojista em `minha.banquinha.app` (`app.` soava genérico). Sem `api.banquinha.app`.
- **Temas como dados:** quase tudo da loja vai ser customizável, e um dia lojistas pagantes vão criar os próprios temas (theme builder). Por isso temas são tokens no banco, nunca CSS fixo por tema.
- **Produtos e serviços:** cada item é um ou outro, com preço fixo, por hora, por dia, "a partir de" ou sob orçamento. O cliente indica onde (endereço da loja, o dele ou online) e quando prefere; sem agenda por enquanto.
- **Identidade visual:** fundo papel quente, tinta quase preta, acento laranja `#ff5a1f`, pastéis (sage, lilac, butter, sky); Bricolage Grotesque (títulos) + Geist.
- **Lojas de exemplo:** Cozinha da Cida (`/cozinhadacida`, marmitas, Recife, tema `tempero`), Unhas da Jéssica (`/unhasdajessica`, manicure, Florianópolis, `docinho`), Neide Beleza & Casa (`/neidebeleza`, revendedora, Goiânia, `perfumaria`) e Zé Faz Tudo (`/zefaztudo`, marido de aluguel, Campinas, `oficina`). Fotos geradas com IA; prompts em `docs/history/example-stores-image-prompts.md`. Sem marcas reais (nada de Avon, Tupperware etc.).
- **Não usar nem mencionar:** o nome antigo do projeto (nem variações próximas) e promoções antigas como "acesso vitalício grátis" para os primeiros da fila de espera. Não existe lista de espera a honrar.
- **E-mail do dono** para contas e integrações: gabriel.silipi@gmail.com.

## Layout

```
apps/web             Next.js 16 (App Router, Tailwind v4): landing, SEO, storefronts, merchant UI
apps/api             NestJS 12 + Fastify + Drizzle/Postgres: the backend (Cloud Run)
packages/api-client  Typed API client generated from the API's OpenAPI document
```

Tooling: **pnpm** workspaces + **Turborepo**. Everything is ESM (`"type": "module"`).

## URLs

- `banquinha.app/<handle>`: storefronts, served by the root dynamic route `apps/web/src/app/[handle]`. Static routes win over it, and the API reserves every root path in `PLATFORM_ROOT_PATHS` (`apps/api/src/stores/store-handle.ts`). **When adding a route at the root of the web app, add it there too** (a unit test covers the list).
- `minha.banquinha.app`: merchant area, served by `apps/web/src/app/painel` through a host rewrite in `next.config.ts` (`minha.localhost:3000` in dev; without the `minha.` host, reach it at `/painel`). `banquinha.app/cadastro` redirects there.
- `/api/*` on the web app is proxied to the API, so the merchant area calls it same-origin and the session cookie is first-party. The API keeps its Cloud Run `run.app` URL (no custom domain, see `docs/deploy.md`).

## Architecture rules

- **All business logic lives in `apps/api`.** Validation, calculations and decisions belong to Nest services. `apps/web` is frontend only: rendering, SEO, forms, UI state.
- The web never touches the database. It talks to the API through `@banquinha/api-client` (import from `@/lib/api`, which sets the base URL).
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
pnpm db:seed        # upsert the example stores (cozinhadacida, unhasdajessica, neidebeleza, zefaztudo)
```

Env: copy `.env.example` to `.env` at the root. The API loads `../../.env` in dev and `next.config.ts` loads it for the web.

## Conventions

- **Language:** code, identifiers, comments, test names, commit messages and docs inside this repo are in **English**. Portuguese (pt-BR) is only for user-facing copy: UI text, error messages shown to users, metadata, emails.
- ESM relative imports use the `.js` extension in the API (`./stores.service.js`).
- Tests: `*.spec.ts` (unit) next to the code and `test/*.e2e-spec.ts` (HTTP via `app.inject`, using `createApp()` from `src/app.ts`).
- Prettier at the root (single quotes, trailing commas, Tailwind class sorting).

## Web (apps/web)

- Next 16 with `cacheComponents` and `partialPrefetching`. APIs differ from Next 13–15: read `apps/web/AGENTS.md` and `node_modules/next/dist/docs/` before using something new. Middleware is now called **proxy** (none in use: host routing is a rewrite in `next.config.ts`).
- Merchant area (`src/app/painel`) is client-rendered: it calls the API with `panelApi` from `@/lib/panel` (base URL `/api`) and navigates with `panelPath()`, which works on both the `minha.` host and `/painel`. Route groups: `(auth)` sign-in screens, `comecar` the onboarding, `(app)` the dashboard (sidebar + content, state in `panel-context.tsx`). `usePanelMe()` routes by `me.onboardingCompleted`: no store yet → `/comecar`, otherwise → dashboard.
- **Storefront themes are data**, not CSS: the API sends design tokens and `themeStyle()` (`src/lib/store-theme.ts`) turns them into CSS variables on the element with the `storefront` class. Inside it, use the token utilities (`bg-background`, `bg-surface`, `text-muted-foreground`, `bg-store`, `text-store-foreground`, `rounded-store`, `rounded-store-sm`), never fixed colors or `text-white`. Never add per-theme CSS. Details: [`docs/themes.md`](docs/themes.md).
- The merchant area is an installable PWA: manifest at `src/app/painel/manifest.webmanifest` (start URL and scope follow the host), icons at `painel/icons/[file]`, service worker at `public/painel/sw.js` (production only). `/painel/*` passes through the `minha.` host rewrite so those absolute paths work on both hosts.
- Panel modals use `Dialog` (`src/app/painel/_components/Dialog.tsx`); on/off settings use `SwitchRow` (`src/components/ui/switch.tsx`).
- After a merchant edit, call the `refreshStorefront(handle)` server action (`src/app/painel/actions.ts`) so the cached storefront updates right away.
- Unstable values (`new Date()`, `Math.random()`) in Server Components break prerendering: use `'use cache'` + `cacheLife`, or move them to the client.
- Design tokens live in `src/app/globals.css` (`bg-ink`, `bg-brand`, `bg-sage`, `font-display`, ...). Use tokens, not ad-hoc colors.
- Base components in `src/components/ui` (shadcn style: `cva` + `cn`). Marketing routes in `src/app/(marketing)`.
- Blog: post metadata in `src/lib/blog.ts`, body in `src/content/blog/<slug>.mdx` (`@next/mdx`, GFM, heading ids via rehype-slug). To add a post, add both; the list, sitemap, RSS (`/blog/rss.xml`), share image and JSON-LD pick it up. `/blog` lives outside `(marketing)` so its generated share image URLs stay unhashed.

## Deploy

Web on Vercel, API on Cloud Run, Postgres on Neon. Pipeline, GitHub settings and one-time GCP setup: [`docs/deploy.md`](docs/deploy.md).

## API (apps/api)

- Nest 12 on the Fastify adapter. `createApp()` in `src/app.ts` holds global setup (validation pipe) and is shared by `main.ts`, tests and `openapi.ts`.
- DTOs use `class-validator`; the global `ValidationPipe` runs with `whitelist` and `transform`.
- Drizzle client is injected with the `DB` token (`src/database/database.module.ts`); schema in `src/database/schema`.
- Env is validated with zod in `src/env.ts`.
- **Auth:** every route needs a merchant session (global `AuthGuard`); mark public ones with `@Public()` and read the merchant with `@CurrentUser()`. Sign-up is name, email, WhatsApp and password (scrypt, `src/auth/password.ts`); login is email + password or Google (`GOOGLE_CLIENT_ID`); "forgot password" emails a 6-digit code. Sessions are an httpOnly cookie whose SHA-256 is stored in `sessions`. Without `RESEND_API_KEY`, reset codes are printed in the API log in dev (and kept in `LogEmailSender.outbox` for tests).
- WhatsApp numbers are stored as digits with the country code (`5541999999999`); normalize input with `toWhatsappNumber()` (`src/common/whatsapp-number.ts`).
- Plans and their limits (stores per account, products per store, photos per product) live in `src/plans/plans.ts`; everyone signs up as `free`.
- Themes (`src/themes`): rows in `themes` with zod-validated design tokens. Platform themes are declared in `system-themes.ts` and upserted by slug on API start; stores point to one (`theme_id`) and may override tokens (`theme_overrides`). To add a platform theme, add an entry there and deploy. See [`docs/themes.md`](docs/themes.md).
- **Images** (`src/images`): uploads are multipart (`file` field, `@fastify/multipart`), read with `ImagesService.readUpload()` and stored with `save()`, which validates and re-encodes them to webp with sharp (variants in `process-image.ts`). Storage is `R2ImageStorage` when the `R2_*` env is set, otherwise `LocalImageStorage` (`UPLOADS_DIR`, served by `UploadsController` at `/uploads`, i.e. `/api/uploads` through the web proxy; refused in production). Keys are random and immutable; call `remove()` with the old URL after replacing an image. The panel shrinks files first with `shrinkImage()` (`apps/web/src/lib/shrink-image.ts`).
- **Products** (`src/products`): the merchant's CRUD under `/stores/:storeId/products`, photos included. Slugs come from the name (`uniqueProductSlug()`) and never change on rename, so shared links keep working. Plan limits (products, photos per product) are enforced here and in `POST /stores`. An item is a `product` or a `service` with a price type (`fixed`, `hourly`, `daily`, `from`, `quote`); rules in `src/products/pricing.ts` (hourly/daily are for services, `quote` has no price). Only firm prices (fixed/hourly/daily) count in order totals; otherwise the order has `priceToConfirm`. The web formats prices with `@/lib/item-price`.
- **Orders** (`src/orders`): the merchant's view of storefront orders under `/stores/:storeId/orders` (paged by `before=<number>`, filter by status, `PATCH` the status). Storefront orders are refused for a fulfillment method the store turned off (`offeredFulfillment()`); `online` is only for orders made of services, which may also carry a preferred date and period. Orders carry the customer's WhatsApp, and the order detail returns `customerLinks`: `wa.me` links with a ready pt-BR message per step, written in `src/orders/customer-messages.ts`.
- **Store accent color:** stored in `theme_overrides.colors` together with an `accentForeground` picked for contrast (`src/themes/contrast.ts`); `null` goes back to the theme's color.
- `POST /stores` ends the onboarding: it creates the store and its first products in one transaction, enforcing the plan limits.
- E2E tests run against a real Postgres: `test/support/global-setup.ts` creates `<db>_test`, migrates and seeds it. `pnpm db:up` must be running.

## Roadmap

Backlog and ticket status live in [`ROADMAP.md`](ROADMAP.md) (IDs like `P1-09`; written in pt-BR for the owner). Update a ticket's status there when you start or finish it.
