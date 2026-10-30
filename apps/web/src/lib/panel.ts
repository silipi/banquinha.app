import { createClient, createConfig } from '@banquinha/api-client';

/**
 * Path inside the merchant area, for client-side navigation. On minha.banquinha.app the
 * area is the whole host (next.config.ts rewrites it to /painel); elsewhere it lives
 * under /painel.
 */
export function panelPath(path: string) {
  return window.location.hostname.startsWith('minha.')
    ? path
    : `/painel${path}`;
}

// Every browser call to the API (merchant area and landing) goes through the web app's
// /api proxy (next.config.ts), so the session cookie stays first-party and no CORS is needed.
export const panelApi = createClient(createConfig({ baseUrl: '/api' }));

/** The API's user-facing message from an error body, or the fallback. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | undefined)?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && typeof message[0] === 'string')
    return message[0];
  return fallback;
}

/**
 * Instagram, Facebook, TikTok and similar apps open links in their own browser,
 * where Google blocks sign-in (disallowed_useragent).
 */
export function isInAppBrowser(userAgent: string) {
  return /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Snapchat|Line\/|LinkedInApp|Twitter/i.test(
    userAgent,
  );
}
