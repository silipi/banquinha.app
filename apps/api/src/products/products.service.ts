import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, max } from 'drizzle-orm';
import type { AuthUser } from '../auth/current-user.decorator.js';
import { sameIds } from '../common/same-ids.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { productImages, products } from '../database/schema/index.js';
import { ImagesService } from '../images/images.service.js';
import { PLANS } from '../plans/plans.js';
import {
  checkFieldValues,
  currentFieldValues,
  type FieldDefinition,
  type FieldValues,
} from '../store-fields/field-values.js';
import {
  StoreFieldsService,
  toStoreFieldDtos,
} from '../store-fields/store-fields.service.js';
import { StoresService } from '../stores/stores.service.js';
import type {
  CreateProductDto,
  ProductDto,
  ProductListDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { checkPricing } from './pricing.js';
import { uniqueProductSlug } from './product-slug.js';

const PRODUCT_NOT_FOUND = 'Produto não encontrado';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly stores: StoresService,
    private readonly images: ImagesService,
    private readonly fields: StoreFieldsService,
  ) {}

  async list(user: AuthUser, storeId: string): Promise<ProductListDto> {
    await this.stores.findOwned(user, storeId);
    const rows = await this.db.query.products.findMany({
      where: eq(products.storeId, storeId),
      orderBy: [asc(products.position), asc(products.createdAt)],
      with: { images: { orderBy: [asc(productImages.position)] } },
    });
    const plan = PLANS[user.plan];
    const fields = await this.fields.rows(storeId);
    return {
      products: rows.map((row) => toProductDto(row, fields)),
      maxProducts: plan.maxProducts,
      maxImagesPerProduct: plan.maxImagesPerProduct,
      maxFields: plan.maxFields,
      fields: toStoreFieldDtos(fields, user.plan),
    };
  }

  /** Adds a product at the end of the list. 403 when the plan's product limit is reached. */
  async create(
    user: AuthUser,
    storeId: string,
    input: CreateProductDto,
  ): Promise<ProductDto> {
    await this.stores.findOwned(user, storeId);
    const pricing = checkPricing({
      kind: input.kind ?? 'product',
      priceType: input.priceType ?? 'fixed',
      priceCents: input.priceCents,
    });
    const plan = PLANS[user.plan];
    const existing = await this.db
      .select({ slug: products.slug, position: products.position })
      .from(products)
      .where(eq(products.storeId, storeId));
    if (existing.length >= plan.maxProducts) {
      throw new ForbiddenException(
        `O plano ${plan.name} permite até ${plan.maxProducts} produtos. Apague um para cadastrar outro.`,
      );
    }
    const attributes = input.attributes
      ? await this.checkAttributes(user, storeId, input.attributes, {})
      : {};

    const [product] = await this.db
      .insert(products)
      .values({
        storeId,
        slug: uniqueProductSlug(
          input.name,
          new Set(existing.map((p) => p.slug)),
        ),
        name: input.name,
        ...pricing,
        description: input.description ?? null,
        active: input.active ?? true,
        attributes,
        position: Math.max(-1, ...existing.map((p) => p.position)) + 1,
      })
      .returning({ id: products.id });
    return this.get(storeId, product!.id);
  }

  async update(
    user: AuthUser,
    storeId: string,
    productId: string,
    input: UpdateProductDto,
  ): Promise<ProductDto> {
    const product = await this.findOwned(user, storeId, productId);
    const changes: Partial<typeof products.$inferInsert> = {};
    if (input.name !== undefined) changes.name = input.name;
    if (
      input.kind !== undefined ||
      input.priceType !== undefined ||
      input.priceCents !== undefined
    ) {
      Object.assign(
        changes,
        checkPricing({
          kind: input.kind ?? product.kind,
          priceType: input.priceType ?? product.priceType,
          priceCents:
            input.priceCents !== undefined
              ? input.priceCents
              : product.priceCents,
        }),
      );
    }
    if (input.description !== undefined) {
      changes.description = input.description;
    }
    if (input.active !== undefined) changes.active = input.active;
    if (input.attributes !== undefined) {
      changes.attributes = await this.checkAttributes(
        user,
        storeId,
        input.attributes,
        product.attributes,
      );
    }
    if (Object.keys(changes).length > 0) {
      await this.db
        .update(products)
        .set(changes)
        .where(eq(products.id, productId));
    }
    return this.get(storeId, productId);
  }

  /** Deletes the product and its photos. Past orders keep their own copy of name and price. */
  async remove(
    user: AuthUser,
    storeId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.findOwned(user, storeId, productId);
    await this.db.delete(products).where(eq(products.id, productId));
    await Promise.all(product.images.map(({ url }) => this.images.remove(url)));
  }

  async reorder(
    user: AuthUser,
    storeId: string,
    productIds: string[],
  ): Promise<ProductListDto> {
    await this.stores.findOwned(user, storeId);
    const existing = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.storeId, storeId));
    if (
      !sameIds(
        productIds,
        existing.map((p) => p.id),
      )
    ) {
      throw new BadRequestException(
        'A lista mudou enquanto você reorganizava. Recarregue a página e tente de novo.',
      );
    }
    await this.db.transaction(async (tx) => {
      for (const [position, id] of productIds.entries()) {
        await tx.update(products).set({ position }).where(eq(products.id, id));
      }
    });
    return this.list(user, storeId);
  }

  /** Adds a photo at the end. 403 when the plan's photo limit is reached. */
  async addImage(
    user: AuthUser,
    storeId: string,
    productId: string,
    file: Buffer,
  ): Promise<ProductDto> {
    const product = await this.findOwned(user, storeId, productId);
    const plan = PLANS[user.plan];
    if (product.images.length >= plan.maxImagesPerProduct) {
      throw new ForbiddenException(
        `O plano ${plan.name} permite até ${plan.maxImagesPerProduct} fotos por produto.`,
      );
    }
    const url = await this.images.save(
      file,
      'product',
      `stores/${storeId}/products/${productId}`,
    );
    try {
      const [{ last } = { last: null }] = await this.db
        .select({ last: max(productImages.position) })
        .from(productImages)
        .where(eq(productImages.productId, productId));
      await this.db
        .insert(productImages)
        .values({ productId, url, position: (last ?? -1) + 1 });
    } catch (error) {
      await this.images.remove(url);
      throw error;
    }
    return this.get(storeId, productId);
  }

  async removeImage(
    user: AuthUser,
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductDto> {
    const product = await this.findOwned(user, storeId, productId);
    const image = product.images.find((i) => i.id === imageId);
    if (!image) throw new NotFoundException('Foto não encontrada');
    await this.db.delete(productImages).where(eq(productImages.id, imageId));
    await this.images.remove(image.url);
    return this.get(storeId, productId);
  }

  async reorderImages(
    user: AuthUser,
    storeId: string,
    productId: string,
    imageIds: string[],
  ): Promise<ProductDto> {
    const product = await this.findOwned(user, storeId, productId);
    if (
      !sameIds(
        imageIds,
        product.images.map((i) => i.id),
      )
    ) {
      throw new BadRequestException(
        'As fotos mudaram enquanto você reorganizava. Recarregue a página e tente de novo.',
      );
    }
    await this.db.transaction(async (tx) => {
      for (const [position, id] of imageIds.entries()) {
        await tx
          .update(productImages)
          .set({ position })
          .where(eq(productImages.id, id));
      }
    });
    return this.get(storeId, productId);
  }

  /**
   * The values to store for an item: the ones given, checked against the fields the plan
   * allows, plus the current values of fields past the limit, kept for an upgrade.
   */
  private async checkAttributes(
    user: AuthUser,
    storeId: string,
    input: Record<string, unknown>,
    current: FieldValues,
  ): Promise<FieldValues> {
    const fields = toStoreFieldDtos(await this.fields.rows(storeId), user.plan);
    const kept = Object.fromEntries(
      fields
        .filter((f) => f.hidden && current[f.id] !== undefined)
        .map((f) => [f.id, current[f.id]!]),
    );
    return {
      ...kept,
      ...checkFieldValues(
        fields.filter((f) => !f.hidden),
        input,
      ),
    };
  }

  private async findOwned(user: AuthUser, storeId: string, productId: string) {
    await this.stores.findOwned(user, storeId);
    const product = await this.db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, storeId)),
      with: { images: { orderBy: [asc(productImages.position)] } },
    });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);
    return product;
  }

  private async get(storeId: string, productId: string): Promise<ProductDto> {
    const product = await this.db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, storeId)),
      with: { images: { orderBy: [asc(productImages.position)] } },
    });
    if (!product) throw new NotFoundException(PRODUCT_NOT_FOUND);
    return toProductDto(product, await this.fields.rows(storeId));
  }
}

function toProductDto(
  product: typeof products.$inferSelect & {
    images: (typeof productImages.$inferSelect)[];
  },
  fields: FieldDefinition[],
): ProductDto {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    kind: product.kind,
    priceType: product.priceType,
    priceCents: product.priceCents,
    active: product.active,
    images: product.images.map(({ id, url }) => ({ id, url })),
    attributes: Object.fromEntries(
      currentFieldValues(fields, product.attributes).map(({ field, value }) => [
        field.id,
        value,
      ]),
    ),
  };
}
