import { toSlug } from '../common/slug.js';

const PRODUCT_SLUG_MAX_LENGTH = 60;

/**
 * URL slug for a product name that isn't in `taken` ("bolo", then "bolo-2"...). Adds the
 * result to `taken`, so calling it for several names gives unique slugs.
 */
export function uniqueProductSlug(name: string, taken: Set<string>): string {
  const base = toSlug(name, PRODUCT_SLUG_MAX_LENGTH) || 'produto';
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}
