import { eq } from 'drizzle-orm';
import type { Db } from '../database.js';
import { productImages, products, stores } from '../schema/index.js';
import { exampleStores } from './example-stores.js';

/**
 * Upserts the example stores and replaces their products. Safe to run repeatedly;
 * other stores are left untouched.
 */
export async function seedExampleStores(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { products: storeProducts, ...store } of exampleStores) {
      const values = {
        ...store,
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
