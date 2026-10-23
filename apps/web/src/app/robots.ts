import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
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
