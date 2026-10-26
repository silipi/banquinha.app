import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { AuthUser } from '../auth/current-user.decorator.js';
import { sameIds } from '../common/same-ids.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { products, storeFields } from '../database/schema/index.js';
import { PLANS, type PlanId } from '../plans/plans.js';
import { StoresService } from '../stores/stores.service.js';
import type {
  CreateStoreFieldDto,
  StoreFieldDto,
  StoreFieldListDto,
  UpdateStoreFieldDto,
} from './dto/store-field.dto.js';
import { checkFieldShape } from './field-values.js';

type FieldRow = typeof storeFields.$inferSelect;

/** The fields of a store in order, the ones past the plan's limit marked hidden. */
export function toStoreFieldDtos(
  rows: FieldRow[],
  plan: PlanId,
): StoreFieldDto[] {
  const { maxFields } = PLANS[plan];
  return rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    type: row.type,
    unit: row.unit,
    options: row.options,
    showOnCard: row.showOnCard,
    hidden: index >= maxFields,
  }));
}

/** Custom fields of a merchant's store. 404 when the store or field isn't theirs. */
@Injectable()
export class StoreFieldsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly stores: StoresService,
  ) {}

  /** All rows of a store, in display order. */
  rows(storeId: string): Promise<FieldRow[]> {
    return this.db.query.storeFields.findMany({
      where: eq(storeFields.storeId, storeId),
      orderBy: [asc(storeFields.position), asc(storeFields.createdAt)],
    });
  }

  async list(user: AuthUser, storeId: string): Promise<StoreFieldListDto> {
    await this.stores.findOwned(user, storeId);
    return {
      fields: toStoreFieldDtos(await this.rows(storeId), user.plan),
      maxFields: PLANS[user.plan].maxFields,
    };
  }

  /** Adds a field at the end. 403 when the plan's limit is reached, 409 for a repeated name. */
  async create(
    user: AuthUser,
    storeId: string,
    input: CreateStoreFieldDto,
  ): Promise<StoreFieldListDto> {
    await this.stores.findOwned(user, storeId);
    const existing = await this.rows(storeId);
    const plan = PLANS[user.plan];
    if (existing.length >= plan.maxFields) {
      throw new ForbiddenException(
        `O plano ${plan.name} permite até ${plan.maxFields} campos. Apague um para criar outro.`,
      );
    }
    checkUniqueLabel(existing, input.label);
    await this.db.insert(storeFields).values({
      storeId,
      label: input.label,
      type: input.type,
      ...checkFieldShape(input),
      showOnCard: input.showOnCard ?? false,
      position: Math.max(-1, ...existing.map((f) => f.position)) + 1,
    });
    return this.list(user, storeId);
  }

  async update(
    user: AuthUser,
    storeId: string,
    fieldId: string,
    input: UpdateStoreFieldDto,
  ): Promise<StoreFieldListDto> {
    await this.stores.findOwned(user, storeId);
    const existing = await this.rows(storeId);
    const field = existing.find((f) => f.id === fieldId);
    if (!field) throw new NotFoundException('Campo não encontrado');

    const changes: Partial<typeof storeFields.$inferInsert> = {};
    if (input.label !== undefined) {
      checkUniqueLabel(
        existing.filter((f) => f.id !== fieldId),
        input.label,
      );
      changes.label = input.label;
    }
    if (input.unit !== undefined || input.options !== undefined) {
      // Values of an option taken out stop showing; they come back if it's added again.
      Object.assign(
        changes,
        checkFieldShape({
          type: field.type,
          unit: input.unit !== undefined ? input.unit : field.unit,
          options: input.options !== undefined ? input.options : field.options,
        }),
      );
    }
    if (input.showOnCard !== undefined) changes.showOnCard = input.showOnCard;
    if (Object.keys(changes).length > 0) {
      await this.db
        .update(storeFields)
        .set(changes)
        .where(eq(storeFields.id, fieldId));
    }
    return this.list(user, storeId);
  }

  /** Deletes the field and its value on every item of the store. */
  async remove(
    user: AuthUser,
    storeId: string,
    fieldId: string,
  ): Promise<StoreFieldListDto> {
    await this.stores.findOwned(user, storeId);
    await this.db.transaction(async (tx) => {
      const deleted = await tx
        .delete(storeFields)
        .where(
          and(eq(storeFields.id, fieldId), eq(storeFields.storeId, storeId)),
        )
        .returning({ id: storeFields.id });
      if (deleted.length === 0) {
        throw new NotFoundException('Campo não encontrado');
      }
      await tx
        .update(products)
        .set({ attributes: sql`${products.attributes} - ${fieldId}::text` })
        .where(
          and(
            eq(products.storeId, storeId),
            sql`${products.attributes} ? ${fieldId}::text`,
          ),
        );
    });
    return this.list(user, storeId);
  }

  async reorder(
    user: AuthUser,
    storeId: string,
    fieldIds: string[],
  ): Promise<StoreFieldListDto> {
    await this.stores.findOwned(user, storeId);
    const existing = await this.rows(storeId);
    if (
      !sameIds(
        fieldIds,
        existing.map((f) => f.id),
      )
    ) {
      throw new BadRequestException(
        'Os campos mudaram enquanto você reorganizava. Recarregue a página e tente de novo.',
      );
    }
    await this.db.transaction(async (tx) => {
      for (const [position, id] of fieldIds.entries()) {
        await tx
          .update(storeFields)
          .set({ position })
          .where(eq(storeFields.id, id));
      }
    });
    return this.list(user, storeId);
  }
}

function checkUniqueLabel(others: FieldRow[], label: string) {
  if (others.some((f) => f.label.toLowerCase() === label.toLowerCase())) {
    throw new ConflictException(`Já existe um campo chamado "${label}"`);
  }
}
