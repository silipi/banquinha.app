import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import {
  orderItems,
  orders,
  productImages,
  products,
  storeFields,
  stores,
  themes,
  users,
} from '../database/schema/index.js';
import { ImagesService } from '../images/images.service.js';
import { AdminAuthService } from './admin-auth.service.js';
import { ADMIN_SETTINGS, type AdminSettings } from './admin-settings.js';
import { effectivePlanSql } from './admin-stats.service.js';
import { AuditLogService } from './audit-log.service.js';
import type {
  AdminStoreDto,
  AdminStoreListDto,
  AdminStoreListQueryDto,
  AdminStoreRowDto,
  DeletedStoreDto,
  DeleteStoreDto,
} from './dto/admin.dto.js';
import { planSummary } from './plan-summary.js';

const PAGE_SIZE = 50;
const STORE_NOT_FOUND = 'Loja não encontrada';

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
};

/** Per-store counts, as correlated subqueries on `stores`. */
const storeCounts = {
  productCount: sql<number>`(select count(*) from products p
    where p.store_id = ${stores.id})::int`,
  photoCount: sql<number>`(select count(*) from product_images i
    join products p on p.id = i.product_id where p.store_id = ${stores.id})::int`,
  orderCount: sql<number>`(select count(*) from orders o
    where o.store_id = ${stores.id})::int`,
  lastOrderAt: sql<string | null>`(select max(o.created_at) from orders o
    where o.store_id = ${stores.id})`,
};

type StoreRowSelect = {
  id: string;
  handle: string;
  name: string;
  city: string | null;
  createdAt: Date;
  suspendedAt: Date | null;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  ownerWhatsapp: string | null;
  plan: string | null;
  productCount: number;
  photoCount: number;
  orderCount: number;
  lastOrderAt: string | Date | null;
};

const rowColumns = {
  id: stores.id,
  handle: stores.handle,
  name: stores.name,
  city: stores.city,
  createdAt: stores.createdAt,
  suspendedAt: stores.suspendedAt,
  ownerId: users.id,
  ownerEmail: users.email,
  ownerName: users.name,
  ownerWhatsapp: users.whatsapp,
  plan: sql<string | null>`${effectivePlanSql}::text`,
  ...storeCounts,
};

function toRow(row: StoreRowSelect): AdminStoreRowDto {
  return {
    id: row.id,
    handle: row.handle,
    name: row.name,
    city: row.city,
    owner: row.ownerId
      ? {
          id: row.ownerId,
          email: row.ownerEmail!,
          name: row.ownerName,
          whatsapp: row.ownerWhatsapp,
        }
      : null,
    plan: (row.plan ?? 'free') as AdminStoreRowDto['plan'],
    productCount: row.productCount,
    photoCount: row.photoCount,
    orderCount: row.orderCount,
    lastOrderAt: row.lastOrderAt
      ? new Date(row.lastOrderAt).toISOString()
      : null,
    createdAt: row.createdAt.toISOString(),
    suspendedAt: row.suspendedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class AdminStoresService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ADMIN_SETTINGS) private readonly settings: AdminSettings,
    private readonly images: ImagesService,
    private readonly audit: AuditLogService,
    private readonly auth: AdminAuthService,
  ) {}

  async list(query: AdminStoreListQueryDto): Promise<AdminStoreListDto> {
    const page = query.page ?? 1;
    const conditions: (SQL | undefined)[] = [];
    if (query.q) {
      const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(
        sql`(${stores.handle} ilike ${pattern} or ${stores.name} ilike ${pattern}
          or ${stores.city} ilike ${pattern} or ${users.email} ilike ${pattern})`,
      );
    }
    switch (query.filter) {
      case 'live':
        conditions.push(
          sql`${stores.ownerId} is not null and ${stores.suspendedAt} is null`,
        );
        break;
      case 'suspended':
        conditions.push(sql`${stores.suspendedAt} is not null`);
        break;
      case 'examples':
        conditions.push(sql`${stores.ownerId} is null`);
        break;
    }
    const where = and(...conditions);

    const [rows, [total]] = await Promise.all([
      this.db
        .select(rowColumns)
        .from(stores)
        .leftJoin(users, eq(users.id, stores.ownerId))
        .where(where)
        .orderBy(desc(stores.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(stores)
        .leftJoin(users, eq(users.id, stores.ownerId))
        .where(where),
    ]);
    return {
      stores: rows.map(toRow),
      total: total?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async get(id: string): Promise<AdminStoreDto> {
    const [row] = await this.db
      .select({
        ...rowColumns,
        store: stores,
        themeName: themes.name,
        owner: users,
        fieldCount: sql<number>`(select count(*) from ${storeFields}
          where ${storeFields.storeId} = ${stores.id})::int`,
      })
      .from(stores)
      .leftJoin(users, eq(users.id, stores.ownerId))
      .innerJoin(themes, eq(themes.id, stores.themeId))
      .where(eq(stores.id, id))
      .limit(1);
    if (!row) throw new NotFoundException(STORE_NOT_FOUND);

    const [productRows, orderRows, statusRows, audit] = await Promise.all([
      this.db
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          kind: products.kind,
          priceType: products.priceType,
          priceCents: products.priceCents,
          active: products.active,
          photoCount: sql<number>`(select count(*) from ${productImages}
            where ${productImages.productId} = ${products.id})::int`,
        })
        .from(products)
        .where(eq(products.storeId, id))
        .orderBy(asc(products.position), asc(products.createdAt)),
      this.db
        .select({
          id: orders.id,
          number: orders.number,
          status: orders.status,
          fulfillment: orders.fulfillment,
          totalCents: orders.totalCents,
          priceToConfirm: orders.priceToConfirm,
          createdAt: orders.createdAt,
          itemCount: sql<number>`(select coalesce(sum(${orderItems.quantity}), 0)
            from ${orderItems} where ${orderItems.orderId} = ${orders.id})::int`,
        })
        .from(orders)
        .where(eq(orders.storeId, id))
        .orderBy(desc(orders.createdAt))
        .limit(20),
      this.db
        .select({ key: orders.status, count: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.storeId, id))
        .groupBy(orders.status),
      this.audit.list({ targetId: id }),
    ]);

    const { store } = row;
    return {
      ...toRow(row),
      bio: store.bio,
      whatsapp: store.whatsapp,
      instagram: store.instagram,
      serviceArea: store.serviceArea,
      themeName: row.themeName,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      fieldCount: row.fieldCount,
      suspensionReason: store.suspensionReason,
      planDetails: row.owner ? planSummary(row.owner) : null,
      products: productRows,
      recentOrders: orderRows.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
      ordersByStatus: statusRows.map((status) => ({
        key: status.key,
        label: ORDER_STATUS_LABELS[status.key] ?? status.key,
        count: status.count,
      })),
      audit: audit.entries,
    };
  }

  /** Takes the storefront offline (404, no orders, out of the sitemap). The merchant keeps the panel. */
  async suspend(id: string, reason: string, userAgent?: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [store] = await tx
        .update(stores)
        .set({ suspendedAt: new Date(), suspensionReason: reason })
        .where(eq(stores.id, id))
        .returning({ handle: stores.handle });
      if (!store) throw new NotFoundException(STORE_NOT_FOUND);
      await this.audit.record(
        {
          action: 'store_suspended',
          summary: `Suspendeu /${store.handle}: ${reason}`,
          targetType: 'store',
          targetId: id,
          details: { handle: store.handle, reason },
          userAgent,
        },
        tx,
      );
    });
  }

  async unsuspend(id: string, userAgent?: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [store] = await tx
        .update(stores)
        .set({ suspendedAt: null, suspensionReason: null })
        .where(eq(stores.id, id))
        .returning({ handle: stores.handle });
      if (!store) throw new NotFoundException(STORE_NOT_FOUND);
      await this.audit.record(
        {
          action: 'store_unsuspended',
          summary: `Reativou /${store.handle}`,
          targetType: 'store',
          targetId: id,
          details: { handle: store.handle },
          userAgent,
        },
        tx,
      );
    });
  }

  /**
   * Deletes the store for good: products, photos (rows and files), custom fields and orders.
   * The handle must be typed again; production also needs a fresh authenticator code.
   */
  async delete(
    id: string,
    input: DeleteStoreDto,
    userAgent?: string,
  ): Promise<DeletedStoreDto> {
    const [store] = await this.db
      .select({
        handle: stores.handle,
        name: stores.name,
        ownerEmail: users.email,
      })
      .from(stores)
      .leftJoin(users, eq(users.id, stores.ownerId))
      .where(eq(stores.id, id))
      .limit(1);
    if (!store) throw new NotFoundException(STORE_NOT_FOUND);
    if (input.handle.toLowerCase() !== store.handle) {
      throw new BadRequestException(
        'O endereço digitado não é o desta loja. Nada foi apagado.',
      );
    }
    const totpStep =
      this.settings.environment === 'production'
        ? await this.auth.confirmWithCode(input.code)
        : undefined;

    const { files, ...counts } = await this.contents([id]);
    const deleted: DeletedStoreDto = { handle: store.handle, ...counts };

    await this.db.transaction(async (tx) => {
      // Foreign keys cascade to products, their images, custom fields, orders and their items.
      await tx.delete(stores).where(eq(stores.id, id));
      await this.audit.record(
        {
          action: 'store_deleted',
          summary: `Apagou /${store.handle} (${store.name})`,
          targetType: 'store',
          targetId: id,
          details: {
            ...deleted,
            name: store.name,
            ownerEmail: store.ownerEmail,
            environment: this.settings.environment,
            ...(totpStep === undefined ? {} : { totpStep }),
          },
          userAgent,
        },
        tx,
      );
    });

    await this.removeFiles(files);
    return deleted;
  }

  /**
   * What deleting these stores takes with it: the counts for the audit log and the image
   * files (logos, banners, photos) to remove once the rows are gone.
   */
  async contents(storeIds: string[]): Promise<{
    productCount: number;
    orderCount: number;
    photoCount: number;
    files: string[];
  }> {
    if (storeIds.length === 0) {
      return { productCount: 0, orderCount: 0, photoCount: 0, files: [] };
    }
    const [storeImages, photos, [orderCount], [productCount]] =
      await Promise.all([
        this.db
          .select({ logoUrl: stores.logoUrl, bannerUrl: stores.bannerUrl })
          .from(stores)
          .where(inArray(stores.id, storeIds)),
        this.db
          .select({ url: productImages.url })
          .from(productImages)
          .innerJoin(products, eq(products.id, productImages.productId))
          .where(inArray(products.storeId, storeIds)),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(inArray(orders.storeId, storeIds)),
        this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(inArray(products.storeId, storeIds)),
      ]);
    return {
      productCount: productCount?.count ?? 0,
      orderCount: orderCount?.count ?? 0,
      photoCount: photos.length,
      files: [
        ...storeImages.flatMap((store) => [store.logoUrl, store.bannerUrl]),
        ...photos.map((photo) => photo.url),
      ].filter((url): url is string => Boolean(url)),
    };
  }

  /** Runs after the rows are gone: a failed removal leaves an orphan file, never a broken store. */
  async removeFiles(urls: string[]): Promise<void> {
    for (const url of urls) await this.images.remove(url);
  }
}
