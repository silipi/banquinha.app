import type { MetadataRoute } from 'next';
import { absoluteUrl, isProduction } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Previews talk to the staging API: keep them out of search results.
  if (!isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bags are per visitor and the merchant area is private: nothing to index.
      disallow: ['/*/sacola', '/cadastro', '/painel'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
