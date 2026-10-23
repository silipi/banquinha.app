import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { productImages, products, stores } from '../database/schema/index.js';
import { resolveTheme, type ThemeTokens } from '../themes/theme-tokens.js';
import type {
  SitemapStoreDto,
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

type StoreWithTheme = typeof stores.$inferSelect & {
  theme: { tokens: ThemeTokens };
};

/** Loads the store's theme tokens with it. */
const withTheme = { theme: { columns: { tokens: true as const } } };

function toStoreSummary(store: StoreWithTheme): StorefrontStoreSummaryDto {
  return {
    handle: store.handle,
    name: store.name,
    logoUrl: store.logoUrl,
    bannerUrl: store.bannerUrl,
    theme: resolveTheme(store.theme.tokens, store.themeOverrides),
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
        ...withTheme,
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
      with: withTheme,
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

  async listForSitemap(): Promise<SitemapStoreDto[]> {
    const rows = await this.db.query.stores.findMany({
      columns: { handle: true, updatedAt: true },
      orderBy: [asc(stores.handle)],
      with: {
        products: {
          columns: { slug: true, updatedAt: true },
          where: eq(products.active, true),
          orderBy: [asc(products.position)],
        },
      },
    });

    return rows.map((store) => ({
      handle: store.handle,
      updatedAt: store.updatedAt.toISOString(),
      products: store.products.map((product) => ({
        slug: product.slug,
        updatedAt: product.updatedAt.toISOString(),
      })),
    }));
  }
}
