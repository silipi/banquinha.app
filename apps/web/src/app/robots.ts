import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Bags are per visitor and have nothing to index.
      disallow: ['/*/sacola', '/cadastro'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
