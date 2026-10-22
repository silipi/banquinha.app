import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { absoluteUrl } from '@/lib/site';
import { getSitemapStores } from '@/lib/storefront';
import { productPath, storePath } from '@/lib/storefront-links';

const staticPages: MetadataRoute.Sitemap = [
  { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
  { url: absoluteUrl('/termos'), changeFrequency: 'yearly', priority: 0.2 },
  {
    url: absoluteUrl('/privacidade'),
    changeFrequency: 'yearly',
    priority: 0.2,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built per request (from cached API data) so `next build` doesn't need the API.
  await connection();

  try {
    const stores = await getSitemapStores();
    return [
      ...staticPages,
      ...stores.flatMap((store) => [
        {
          url: absoluteUrl(storePath(store.handle)),
          lastModified: store.updatedAt,
          changeFrequency: 'daily' as const,
          priority: 0.8,
        },
        ...store.products.map((product) => ({
          url: absoluteUrl(productPath(store.handle, product.slug)),
          lastModified: product.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        })),
      ]),
    ];
  } catch {
    // Better a partial sitemap than a failing one while the API is down.
    return staticPages;
  }
}
