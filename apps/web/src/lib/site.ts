import type { Metadata } from 'next';

/** Public origin of the web app. Used for canonical URLs, sitemaps and share images. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
);

export const siteName = 'vendeu.store';

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

/** Open Graph fields shared by every page. Next replaces `openGraph` as a whole, so pages spread this. */
export const openGraphDefaults = {
  siteName,
  locale: 'pt_BR',
  type: 'website',
} satisfies Metadata['openGraph'];
