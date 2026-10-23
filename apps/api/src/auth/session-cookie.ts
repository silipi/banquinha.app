import { createHash, randomBytes } from 'node:crypto';
import type { CookieSerializeOptions } from '@fastify/cookie';

export const SESSION_COOKIE = 'banquinha_session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// The web app proxies /api to this API, so the cookie is first-party on the web's host.
export function sessionCookieOptions(): CookieSerializeOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
