// The handle is the store's public path: banquinha.app/<handle>.
// Only lowercase letters, digits and single hyphens, so it never needs URL encoding
// and can't collide with files (no dots) or Next.js internals (no underscores).
export const STORE_HANDLE_MIN_LENGTH = 3;
export const STORE_HANDLE_MAX_LENGTH = 30;

const STORE_HANDLE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Top-level paths of the web app (apps/web/src/app and public/). A store with one of
 * these handles would be shadowed by the platform page, so they can never be used.
 * Keep in sync when adding a route at the root of the web app.
 */
export const PLATFORM_ROOT_PATHS = [
  'api', // proxied to the API (next.config.ts)
  'blog',
  'cadastro', // redirects to the merchant area
  'lojas', // public/lojas: example store images
  'opengraph-image',
  'painel', // merchant area (app.banquinha.app)
  'privacidade',
  'robots',
  'sitemap',
  'termos',
] as const;

// Paths and subdomains the platform uses or may use in the future.
const RESERVED_HANDLES = new Set<string>([
  ...PLATFORM_ROOT_PATHS,
  // Platform hosts and areas
  'admin',
  'app',
  'cdn',
  'dashboard',
  'dev',
  'docs',
  'mail',
  'staging',
  'static',
  'status',
  'www',
  // Account and auth
  'auth',
  'callback',
  'conta',
  'entrar',
  'login',
  'logout',
  'oauth',
  'sair',
  'senha',
  'signin',
  'signup',
  // Merchant area and commerce words
  'carrinho',
  'checkout',
  'configuracoes',
  'loja',
  'lojista',
  'pagamento',
  'pedido',
  'pedidos',
  'produto',
  'produtos',
  'sacola',
  // Institutional pages
  'ajuda',
  'contato',
  'email',
  'faq',
  'help',
  'planos',
  'precos',
  'sobre',
  'suporte',
  // Files and assets
  'apple-icon',
  'assets',
  'favicon',
  'feed',
  'icon',
  'images',
  'manifest',
  'media',
  'public',
  'rss',
  'uploads',
  // Brand
  'banquinha',
]);

/**
 * Turns free text (e.g. the store name) into a URL-safe handle:
 * no accents, lowercase, only letters, digits and hyphens.
 */
export function toStoreHandle(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, STORE_HANDLE_MAX_LENGTH)
    .replace(/-+$/g, '');
}

export type StoreHandleProblem = 'too_short' | 'invalid' | 'reserved';

export function findStoreHandleProblem(
  handle: string,
): StoreHandleProblem | null {
  if (handle.length < STORE_HANDLE_MIN_LENGTH) return 'too_short';
  if (!STORE_HANDLE_PATTERN.test(handle)) return 'invalid';
  if (RESERVED_HANDLES.has(handle)) return 'reserved';
  return null;
}
