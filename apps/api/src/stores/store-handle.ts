// The handle becomes the store's subdomain: <handle>.vendeu.store
export const STORE_HANDLE_MIN_LENGTH = 3;
export const STORE_HANDLE_MAX_LENGTH = 30;

const STORE_HANDLE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Subdomains the platform uses or may use in the future.
const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'app',
  'ajuda',
  'blog',
  'cdn',
  'checkout',
  'conta',
  'dashboard',
  'dev',
  'docs',
  'email',
  'help',
  'loja',
  'lojas',
  'mail',
  'painel',
  'pagamento',
  'staging',
  'static',
  'status',
  'suporte',
  'vendeu',
  'www',
]);

/**
 * Turns free text (e.g. the store name) into a subdomain-safe handle:
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
