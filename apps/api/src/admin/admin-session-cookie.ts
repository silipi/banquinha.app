import type { CookieSerializeOptions } from '@fastify/cookie';

export const ADMIN_SESSION_COOKIE = 'banquinha_admin';
/** Hard limit of a session, however active. */
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
/** Sessions end after this long without a request. */
export const ADMIN_SESSION_IDLE_MS = 60 * 60 * 1000;

// Browsers reach the API through the web's /api proxy, so admin calls are /api/admin/*:
// the cookie is never sent anywhere else, not even to the merchant routes. It is host-only,
// so it stays on the admin host. Strict: no cross-site request ever carries it.
export function adminSessionCookieOptions(): CookieSerializeOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/admin',
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  };
}
