import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { productImages, products, stores } from '../database/schema/index.js';
import type {
  StorefrontProductDto,
  StorefrontStoreDto,
  StorefrontStoreSummaryDto,
} from './dto/storefront.dto.js';

const STORE_NOT_FOUND = 'Loja não encontrada';
const PRODUCT_NOT_FOUND = 'Produto não encontrado';

const imagesInOrder = {
  columns: { url: true as const },
  orderBy: [asc(productImages.position)],
};

type StoreRow = typeof stores.$inferSelect;

function toStoreSummary(store: StoreRow): StorefrontStoreSummaryDto {
  return {
    handle: store.handle,
    name: store.name,
    logoUrl: store.logoUrl,
    accentColor: store.accentColor,
  };
}

/** Read-only, public view of a store and its catalog. */
@Injectable()
export class StorefrontService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async getStore(handle: string): Promise<StorefrontStoreDto> {
    const store = await this.db.query.stores.findFirst({
      where: eq(stores.handle, handle.toLowerCase()),
      with: {
        products: {
          where: eq(products.active, true),
          orderBy: [asc(products.position), asc(products.createdAt)],
          with: { images: { ...imagesInOrder, limit: 1 } },
        },
      },
    });
    if (!store) throw new NotFoundException(STORE_NOT_FOUND);

    return {
      ...toStoreSummary(store),
      bio: store.bio,
      city: store.city,
      contact: {
        whatsapp: store.whatsapp,
        instagram: store.instagram,
        locationUrl: store.locationUrl,
      },
      products: store.products.map((product) => ({
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.images[0]?.url ?? null,
      })),
    };
  }

  async getProduct(
    handle: string,
    slug: string,
  ): Promise<StorefrontProductDto> {
    const store = await this.db.query.stores.findFirst({
      where: eq(stores.handle, handle.toLowerCase()),
    });
    if (!store) throw new NotFoundException(STORE_NOT_FOUND);

    const product = await this.db.query.products.findFirst({
      where: and(
        eq(products.storeId, store.id),
        eq(products.slug, slug.toLowerCase()),
        eq(products.active, true),
      ),
      with: { images: imagesInOrder },
    });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);

    return {
      slug: product.slug,
      name: product.name,
      description: product.description,
      priceCents: product.priceCents,
      images: product.images,
      store: toStoreSummary(store),
    };
  }
}
