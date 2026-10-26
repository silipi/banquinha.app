import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';
import type { AuthUser } from '../auth/current-user.decorator.js';
import { toSlug } from '../common/slug.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { products, stores, themes, users } from '../database/schema/index.js';
import { ImagesService } from '../images/images.service.js';
import { PLANS } from '../plans/plans.js';
import { resolveTheme } from '../themes/theme-tokens.js';
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
const PRODUCT_SLUG_MAX_LENGTH = 60;

type StoreRow = typeof stores.$inferSelect;

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

/** Slugs from product names, unique within the list ("bolo", "bolo-2"). */
function productSlugs(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const base = toSlug(name, PRODUCT_SLUG_MAX_LENGTH) || 'produto';
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return slug;
  });
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

    const theme = await this.themes.findUsable(user, input.themeId);
    const slugs = productSlugs(input.products.map(({ name }) => name));

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
            priceCents: product.priceCents,
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
      productCount,
      maxProducts: PLANS[user.plan].maxProducts,
      setup: [
        { id: 'logo', done: Boolean(store.logoUrl) },
        { id: 'banner', done: Boolean(store.bannerUrl) },
        { id: 'description', done: Boolean(store.bio) },
      ],
    };
  }

  async update(
    user: AuthUser,
    id: string,
    input: UpdateStoreDto,
  ): Promise<StoreDashboardDto> {
    await this.findOwned(user, id);
    const changes: Partial<StoreRow> = {};
    if (input.bio !== undefined) changes.bio = input.bio;
    if (input.themeId !== undefined) {
      changes.themeId = (await this.themes.findUsable(user, input.themeId)).id;
    }
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

  private async findOwned(user: AuthUser, id: string): Promise<StoreRow> {
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
