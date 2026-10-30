import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, isNotNull, sql, type SQL } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { stores, users } from '../database/schema/index.js';
import {
  effectivePlan,
  hasActiveOverride,
  PLANS,
  type PlanColumns,
} from '../plans/plans.js';
import { AuditLogService } from './audit-log.service.js';
import type {
  AdminAccountDto,
  AdminAccountListDto,
  AdminAccountListQueryDto,
  AdminAccountRowDto,
  PlanSummaryDto,
  SetPlanOverrideDto,
} from './dto/admin.dto.js';

const PAGE_SIZE = 50;
const ACCOUNT_NOT_FOUND = 'Conta não encontrada';

type UserRow = typeof users.$inferSelect;

export function planSummary(
  account: PlanColumns & { planOverrideReason: string | null },
): PlanSummaryDto {
  return {
    effective: effectivePlan(account),
    paid: account.plan,
    override: account.planOverride,
    overrideExpiresAt: account.planOverrideExpiresAt?.toISOString() ?? null,
    overrideReason: account.planOverrideReason,
    overrideActive: hasActiveOverride(account),
  };
}

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

@Injectable()
export class AdminAccountsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly audit: AuditLogService,
  ) {}

  async list(query: AdminAccountListQueryDto): Promise<AdminAccountListDto> {
    const page = query.page ?? 1;
    const conditions: (SQL | undefined)[] = [];
    if (query.q) {
      const pattern = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(
        sql`(${users.email} ilike ${pattern} or ${users.name} ilike ${pattern}
          or ${users.whatsapp} ilike ${pattern})`,
      );
    }
    if (query.comped) conditions.push(isNotNull(users.planOverride));
    const where = and(...conditions);

    const [rows, [total]] = await Promise.all([
      this.db
        .select({ user: users, ...this.accountCounts() })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(where),
    ]);
    return {
      accounts: rows.map(toAccountRow),
      total: total?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async get(id: string): Promise<AdminAccountDto> {
    const [row] = await this.db
      .select({ user: users, ...this.accountCounts() })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!row) throw new NotFoundException(ACCOUNT_NOT_FOUND);
    const [owned, audit] = await Promise.all([
      this.db
        .select({
          id: stores.id,
          handle: stores.handle,
          name: stores.name,
          suspendedAt: stores.suspendedAt,
        })
        .from(stores)
        .where(eq(stores.ownerId, id))
        .orderBy(asc(stores.createdAt)),
      this.audit.list({ targetId: id }),
    ]);
    return {
      ...toAccountRow(row),
      stores: owned.map((store) => ({
        ...store,
        suspendedAt: store.suspendedAt?.toISOString() ?? null,
      })),
      audit: audit.entries,
    };
  }

  /** Gives the account a plan for free, until `expiresAt` or for good. Replaces any earlier one. */
  async setPlanOverride(
    id: string,
    input: SetPlanOverrideDto,
    userAgent?: string,
  ): Promise<AdminAccountDto> {
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('A data de fim precisa ser no futuro');
    }
    await this.db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .for('update');
      if (!before) throw new NotFoundException(ACCOUNT_NOT_FOUND);
      await tx
        .update(users)
        .set({
          planOverride: input.plan,
          planOverrideExpiresAt: expiresAt,
          planOverrideReason: input.reason,
        })
        .where(eq(users.id, id));
      const until = expiresAt ? ` até ${formatDate(expiresAt)}` : ' sem prazo';
      await this.audit.record(
        {
          action: 'plan_override_set',
          summary: `Plano ${PLANS[input.plan].name} para ${before.email}${until}: ${input.reason}`,
          targetType: 'account',
          targetId: id,
          details: {
            email: before.email,
            before: overrideSnapshot(before),
            after: {
              plan: input.plan,
              expiresAt: expiresAt?.toISOString() ?? null,
              reason: input.reason,
            },
          },
          userAgent,
        },
        tx,
      );
    });
    return this.get(id);
  }

  async removePlanOverride(
    id: string,
    userAgent?: string,
  ): Promise<AdminAccountDto> {
    await this.db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .for('update');
      if (!before) throw new NotFoundException(ACCOUNT_NOT_FOUND);
      if (!before.planOverride) return;
      await tx
        .update(users)
        .set({
          planOverride: null,
          planOverrideExpiresAt: null,
          planOverrideReason: null,
        })
        .where(eq(users.id, id));
      await this.audit.record(
        {
          action: 'plan_override_removed',
          summary: `Tirou o plano ${PLANS[before.planOverride].name} de ${before.email}`,
          targetType: 'account',
          targetId: id,
          details: { email: before.email, before: overrideSnapshot(before) },
          userAgent,
        },
        tx,
      );
    });
    return this.get(id);
  }

  private accountCounts() {
    return {
      storeCount: sql<number>`(select count(*) from stores s
        where s.owner_id = ${users.id})::int`,
      lastSignInAt: sql<string | null>`(select max(created_at) from sessions s
        where s.user_id = ${users.id})`,
    };
  }
}

function overrideSnapshot(user: UserRow) {
  return {
    plan: user.planOverride,
    expiresAt: user.planOverrideExpiresAt?.toISOString() ?? null,
    reason: user.planOverrideReason,
  };
}

function toAccountRow(row: {
  user: UserRow;
  storeCount: number;
  lastSignInAt: string | Date | null;
}): AdminAccountRowDto {
  const { user } = row;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    whatsapp: user.whatsapp,
    signInMethods: [
      ...(user.passwordHash ? (['password'] as const) : []),
      ...(user.googleSub ? (['google'] as const) : []),
    ],
    plan: planSummary(user),
    storeCount: row.storeCount,
    createdAt: user.createdAt.toISOString(),
    lastSignInAt: row.lastSignInAt
      ? new Date(row.lastSignInAt).toISOString()
      : null,
  };
}
