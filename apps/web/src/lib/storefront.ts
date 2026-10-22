'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import { storefrontGetProduct, storefrontGetStore } from '@/lib/api';

// Tagged per store so merchant edits (phase 2) can revalidate with updateTag(storeCacheTag(handle)).
const storeCacheTag = (handle: string) => `store:${handle.toLowerCase()}`;

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
