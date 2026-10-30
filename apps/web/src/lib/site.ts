import type { Metadata } from 'next';

/** True only for the production deployment on Vercel, not for previews or local dev. */
export const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

/**
 * Public origin of the web app. Used for canonical URLs, sitemaps and share images.
 * Previews leave NEXT_PUBLIC_SITE_URL unset and use their own deployment URL.
 */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000'),
);

export const siteName = 'banquinha.app';

/** Domain shown to people in copy and store links, regardless of the environment. */
export const brandDomain = 'banquinha.app';

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

/** Open Graph fields shared by every page. Next replaces `openGraph` as a whole, so pages spread this. */
export const openGraphDefaults = {
  siteName,
  locale: 'pt_BR',
  type: 'website',
} satisfies Metadata['openGraph'];
