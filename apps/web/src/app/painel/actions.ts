'use server';

import { updateTag } from 'next/cache';
import { storeCacheTag } from '@/lib/storefront-cache';

/** Shows a merchant's edits on their storefront right away instead of after the cache expires. */
export async function refreshStorefront(handle: string) {
  updateTag(storeCacheTag(handle));
}
