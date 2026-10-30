import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import type { AuthUser } from '../auth/current-user.decorator.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import {
  orders,
  products,
  stores,
  themes,
  users,
} from '../database/schema/index.js';
import { ImagesService } from '../images/images.service.js';
import { PLANS } from '../plans/plans.js';
import { checkPricing } from '../products/pricing.js';
import { uniqueProductSlug } from '../products/product-slug.js';
import { assertSomeFulfillment } from '../storefront/fulfillment.js';
import { readableTextOn } from '../themes/contrast.js';
import { resolveTheme, type ThemeOverrides } from '../themes/theme-tokens.js';
import { ThemesService } from '../themes/themes.service.js';
import type { CheckHandleResponseDto } from './dto/check-handle.dto.js';
import type {
  CreateStoreDto,
  StoreDashboardDto,
  StoreImageSlot,
  StoreSummaryDto,
  UpdateStoreDto,
} from './dto/store.dto.js';
import {
  STORE_HANDLE_MIN_LENGTH,
  findStoreHandleProblem,
  toStoreHandle,
  type StoreHandleProblem,
} from './store-handle.js';

const PROBLEM_MESSAGES: Record<StoreHandleProblem, string> = {
  too_short: `Use pelo menos ${STORE_HANDLE_MIN_LENGTH} letras ou números`,
  invalid: 'Use só letras, números e hífens',
  reserved: 'Esse endereço é reservado',
};
const HANDLE_TAKEN = 'Esse endereço já está em uso';

type StoreRow = typeof stores.$inferSelect;

/** Overrides with the accent color (and legible text on it) set, or removed for null. */
function withAccent(
  overrides: ThemeOverrides | null,
  accent: string | null,
): ThemeOverrides | null {
  const {
    accent: _accent,
    accentForeground: _accentForeground,
    ...colors
  } = overrides?.colors ?? {};
  const next: ThemeOverrides = {
    ...overrides,
    colors: accent
      ? {
          ...colors,
          accent: accent.toLowerCase(),
          accentForeground: readableTextOn(accent),
        }
      : colors,
  };
  if (Object.keys(next.colors ?? {}).length === 0) delete next.colors;
  return Object.keys(next).length > 0 ? next : null;
}

const IMAGE_COLUMNS = {
  logo: 'logoUrl',
  banner: 'bannerUrl',
} as const satisfies Record<StoreImageSlot, keyof StoreRow>;

/** Postgres unique violation, also when wrapped by Drizzle. */
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (e as { code?: string } | undefined)?.code;
  return (
    code(error) === '23505' ||
    code((error as { cause?: unknown }).cause) === '23505'
  );
}

@Injectable()
export class StoresService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly themes: ThemesService,
    private readonly images: ImagesService,
  ) {}

  async checkHandle(input: string): Promise<CheckHandleResponseDto> {
    const handle = toStoreHandle(input);
    const problem = findStoreHandleProblem(handle);
    if (problem) {
      return { handle, available: false, message: PROBLEM_MESSAGES[problem] };
    }
    if ((await this.takenHandles([handle])).size > 0) {
      return {
        handle,
        available: false,
        message: HANDLE_TAKEN,
        suggestions: await this.suggestHandles(handle),
      };
    }
    return { handle, available: true };
  }

  async listMine(userId: string): Promise<StoreSummaryDto[]> {
    return this.db
      .select({ id: stores.id, handle: stores.handle, name: stores.name })
      .from(stores)
      .where(eq(stores.ownerId, userId))
      .orderBy(stores.createdAt);
  }

  /** Last step of the onboarding: creates the store with its first products, live right away. */
  async create(
    user: AuthUser,
    input: CreateStoreDto,
  ): Promise<StoreSummaryDto> {
    const plan = PLANS[user.plan];
    const owned = await this.listMine(user.id);
    if (owned.length >= plan.maxStores) {
      throw new ForbiddenException(
        plan.maxStores === 1
          ? `O plano ${plan.name} permite 1 loja.`
          : `O plano ${plan.name} permite até ${plan.maxStores} lojas.`,
      );
    }
    if (input.products.length > plan.maxProducts) {
      throw new BadRequestException(
        `O plano ${plan.name} permite até ${plan.maxProducts} produtos.`,
      );
    }

    const handleCheck = await this.checkHandle(input.handle);
    if (!handleCheck.available) {
      throw handleCheck.message === HANDLE_TAKEN
        ? new ConflictException(HANDLE_TAKEN)
        : new BadRequestException(handleCheck.message);
    }

    const pricing = input.products.map((product) =>
      checkPricing({
        kind: product.kind ?? 'product',
        priceType: product.priceType ?? 'fixed',
        priceCents: product.priceCents,
      }),
    );
    const fulfillment = {
      pickupEnabled: input.pickupEnabled ?? true,
      deliveryEnabled: input.deliveryEnabled ?? true,
      onlineEnabled: input.onlineEnabled ?? false,
    };
    assertSomeFulfillment(fulfillment);

    const theme = await this.themes.findUsable(user, input.themeId);
    const takenSlugs = new Set<string>();
    const slugs = input.products.map(({ name }) =>
      uniqueProductSlug(name, takenSlugs),
    );

    try {
      return await this.db.transaction(async (tx) => {
        const [store] = await tx
          .insert(stores)
          .values({
            ownerId: user.id,
            handle: handleCheck.handle,
            name: input.name,
            whatsapp: input.whatsapp,
            themeId: theme.id,
            ...fulfillment,
          })
          .returning({
            id: stores.id,
            handle: stores.handle,
            name: stores.name,
          });
        if (!store) throw new Error('Store insert returned no row');

        await tx.insert(products).values(
          input.products.map((product, position) => ({
            storeId: store.id,
            slug: slugs[position]!,
            name: product.name,
            ...pricing[position]!,
            description: product.description ?? null,
            position,
          })),
        );

        // Accounts created with Google have no WhatsApp yet: keep the one given here.
        if (!user.whatsapp) {
          await tx
            .update(users)
            .set({ whatsapp: input.whatsapp })
            .where(eq(users.id, user.id));
        }
        return store;
      });
    } catch (error) {
      // Someone took the handle between the check and the insert.
      if (isUniqueViolation(error)) throw new ConflictException(HANDLE_TAKEN);
      throw error;
    }
  }

  async getDashboard(user: AuthUser, id: string): Promise<StoreDashboardDto> {
    const store = await this.findOwned(user, id);
    const [{ productCount } = { productCount: 0 }] = await this.db
      .select({ productCount: count() })
      .from(products)
      .where(eq(products.storeId, store.id));
    const [orderCounts = { total: 0, fresh: 0 }] = await this.db
      .select({
        total: count(),
        fresh: count(sql`case when ${orders.status} = 'new' then 1 end`),
      })
      .from(orders)
      .where(eq(orders.storeId, store.id));
    const [theme] = await this.db
      .select({ tokens: themes.tokens })
      .from(themes)
      .where(eq(themes.id, store.themeId));
    if (!theme) throw new Error(`Theme ${store.themeId} not found`);

    return {
      id: store.id,
      handle: store.handle,
      name: store.name,
      bio: store.bio,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      themeId: store.themeId,
      theme: resolveTheme(theme.tokens, store.themeOverrides),
      accentColor: store.themeOverrides?.colors?.accent ?? null,
      city: store.city,
      whatsapp: store.whatsapp,
      instagram: store.instagram,
      locationUrl: store.locationUrl,
      pickupEnabled: store.pickupEnabled,
      deliveryEnabled: store.deliveryEnabled,
      onlineEnabled: store.onlineEnabled,
      serviceArea: store.serviceArea,
      productCount,
      maxProducts: PLANS[user.plan].maxProducts,
      orderCount: orderCounts.total,
      newOrderCount: orderCounts.fresh,
      suspended: store.suspendedAt !== null,
      setup: [
        { id: 'logo', done: Boolean(store.logoUrl) },
        { id: 'banner', done: Boolean(store.bannerUrl) },
        { id: 'description', done: Boolean(store.bio) },
      ],
    };
  }

  /** Edits store details. Only the fields sent change. */
  async update(
    user: AuthUser,
    id: string,
    input: UpdateStoreDto,
  ): Promise<StoreDashboardDto> {
    const store = await this.findOwned(user, id);
    const changes: Partial<StoreRow> = {};
    for (const field of [
      'bio',
      'name',
      'city',
      'whatsapp',
      'instagram',
      'locationUrl',
      'pickupEnabled',
      'deliveryEnabled',
      'onlineEnabled',
      'serviceArea',
    ] as const) {
      if (input[field] !== undefined) {
        (changes as Record<string, unknown>)[field] = input[field];
      }
    }
    if (input.themeId !== undefined) {
      changes.themeId = (await this.themes.findUsable(user, input.themeId)).id;
    }
    if (input.accentColor !== undefined) {
      changes.themeOverrides = withAccent(
        store.themeOverrides,
        input.accentColor,
      );
    }

    assertSomeFulfillment({
      pickupEnabled: changes.pickupEnabled ?? store.pickupEnabled,
      deliveryEnabled: changes.deliveryEnabled ?? store.deliveryEnabled,
      onlineEnabled: changes.onlineEnabled ?? store.onlineEnabled,
    });

    if (Object.keys(changes).length > 0) {
      await this.db.update(stores).set(changes).where(eq(stores.id, id));
    }
    return this.getDashboard(user, id);
  }

  async setImage(
    user: AuthUser,
    id: string,
    slot: StoreImageSlot,
    file: Buffer,
  ): Promise<StoreDashboardDto> {
    const store = await this.findOwned(user, id);
    const column = IMAGE_COLUMNS[slot];
    const url = await this.images.save(
      file,
      slot,
      `stores/${store.id}/${slot}`,
    );
    try {
      await this.db
        .update(stores)
        .set({ [column]: url })
        .where(eq(stores.id, id));
    } catch (error) {
      await this.images.remove(url);
      throw error;
    }
    await this.images.remove(store[column]);
    return this.getDashboard(user, id);
  }

  async removeImage(
    user: AuthUser,
    id: string,
    slot: StoreImageSlot,
  ): Promise<StoreDashboardDto> {
    const store = await this.findOwned(user, id);
    const column = IMAGE_COLUMNS[slot];
    if (store[column]) {
      await this.db
        .update(stores)
        .set({ [column]: null })
        .where(eq(stores.id, id));
      await this.images.remove(store[column]);
    }
    return this.getDashboard(user, id);
  }

  /** One of the merchant's stores; 404 when it doesn't exist or isn't theirs. */
  async findOwned(user: AuthUser, id: string): Promise<StoreRow> {
    const [store] = await this.db
      .select()
      .from(stores)
      .where(and(eq(stores.id, id), eq(stores.ownerId, user.id)))
      .limit(1);
    // Same answer for "doesn't exist" and "not yours".
    if (!store) throw new NotFoundException('Loja não encontrada');
    return store;
  }

  private async takenHandles(handles: string[]): Promise<Set<string>> {
    const rows = await this.db
      .select({ handle: stores.handle })
      .from(stores)
      .where(inArray(stores.handle, handles));
    return new Set(rows.map((row) => row.handle));
  }

  private async suggestHandles(handle: string): Promise<string[]> {
    const candidates = [
      `${handle}-loja`,
      `loja-${handle}`,
      `${handle}-oficial`,
      `${handle}2`,
      `${handle}3`,
    ]
      .map(toStoreHandle)
      .filter((candidate) => !findStoreHandleProblem(candidate));
    const taken = await this.takenHandles(candidates);
    return candidates.filter((c) => !taken.has(c)).slice(0, 3);
  }
}
