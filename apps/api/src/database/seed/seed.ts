import { eq, isNotNull } from 'drizzle-orm';
import { syncSystemThemes } from '../../themes/sync-system-themes.js';
import type { Db } from '../database.js';
import { productImages, products, stores, themes } from '../schema/index.js';
import { exampleStores } from './example-stores.js';

/**
 * Upserts the example stores and replaces their products. Safe to run repeatedly;
 * other stores are left untouched.
 */
export async function seedExampleStores(db: Db): Promise<void> {
  await syncSystemThemes(db);
  const platformThemes = await db
    .select({ id: themes.id, slug: themes.slug })
    .from(themes)
    .where(isNotNull(themes.slug));
  const themeIdBySlug = new Map(platformThemes.map((t) => [t.slug, t.id]));

  await db.transaction(async (tx) => {
    for (const {
      products: storeProducts,
      themeSlug,
      ...store
    } of exampleStores) {
      const themeId = themeIdBySlug.get(themeSlug);
      if (!themeId) throw new Error(`Unknown theme "${themeSlug}"`);
      const values = {
        ...store,
        themeId,
        logoUrl: `/lojas/${store.handle}/logo.webp`,
      };
      const [upserted] = await tx
        .insert(stores)
        .values(values)
        .onConflictDoUpdate({ target: stores.handle, set: values })
        .returning({ id: stores.id });
      const storeId = upserted!.id;

      await tx.delete(products).where(eq(products.storeId, storeId));

      const inserted = await tx
        .insert(products)
        .values(
          storeProducts.map((product, position) => ({
            ...product,
            storeId,
            position,
          })),
        )
        .returning({ id: products.id, slug: products.slug });

      await tx.insert(productImages).values(
        inserted.map(({ id, slug }) => ({
          productId: id,
          url: `/lojas/${store.handle}/${slug}.webp`,
        })),
      );
    }
  });
}
