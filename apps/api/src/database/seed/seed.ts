import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { syncSystemThemes } from '../../themes/sync-system-themes.js';
import type { Db } from '../database.js';
import { productImages, products, stores, themes } from '../schema/index.js';
import { exampleStores, retiredExampleHandles } from './example-stores.js';

/**
 * Upserts the example stores, replaces their products and deletes retired ones.
 * Safe to run repeatedly; merchants' stores are left untouched.
 */
export async function seedExampleStores(db: Db): Promise<void> {
  await syncSystemThemes(db);
  const platformThemes = await db
    .select({ id: themes.id, slug: themes.slug })
    .from(themes)
    .where(isNotNull(themes.slug));
  const themeIdBySlug = new Map(platformThemes.map((t) => [t.slug, t.id]));

  await db.transaction(async (tx) => {
    // Products, images and demo orders go with the store (on delete cascade).
    await tx
      .delete(stores)
      .where(
        and(
          inArray(stores.handle, retiredExampleHandles),
          isNull(stores.ownerId),
        ),
      );

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
        // Example stores have no owner; never take over a merchant's store.
        .onConflictDoUpdate({
          target: stores.handle,
          set: values,
          setWhere: isNull(stores.ownerId),
        })
        .returning({ id: stores.id });
      if (!upserted) {
        console.warn(`Skipped "${store.handle}": a merchant owns that handle.`);
        continue;
      }
      const storeId = upserted.id;

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
