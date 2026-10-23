'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import {
  sitemapListStorefronts,
  storefrontGetProduct,
  storefrontGetStore,
} from '@/lib/api';
import { storeCacheTag } from '@/lib/storefront-cache';

/** Public store with its products, or null when the store does not exist. */
export async function getStore(handle: string) {
  cacheLife('minutes');
  cacheTag(storeCacheTag(handle));

  const { data, response } = await storefrontGetStore({ path: { handle } });
  if (response?.status === 404) return null;
  if (!data) {
    throw new Error(`Failed to load store ${handle}: ${response?.status}`);
  }
  return data;
}

/** Public product, or null when the store or product does not exist. */
export async function getProduct(handle: string, slug: string) {
  cacheLife('minutes');
  cacheTag(storeCacheTag(handle));

  const { data, response } = await storefrontGetProduct({
    path: { handle, slug },
  });
  if (response?.status === 404) return null;
  if (!data) {
    throw new Error(
      `Failed to load product ${handle}/${slug}: ${response?.status}`,
    );
  }
  return data;
}

/** Every public store and product, for sitemap.xml. */
export async function getSitemapStores() {
  cacheLife('hours');
  cacheTag('sitemap');

  const { data, response } = await sitemapListStorefronts();
  if (!data) throw new Error(`Failed to load sitemap: ${response?.status}`);
  return data;
}
