import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gt, lt, sql } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { adminAuditLog } from '../database/schema/index.js';
import type { AuditEntryDto, AuditLogDto } from './dto/admin.dto.js';

export type AdminAction =
  | 'login_succeeded'
  | 'login_failed'
  | 'logout'
  | 'plan_override_set'
  | 'plan_override_removed'
  | 'store_suspended'
  | 'store_unsuspended'
  | 'store_deleted'
  | 'account_deleted';

export interface AuditEntry {
  action: AdminAction;
  summary: string;
  targetType?: 'store' | 'account';
  targetId?: string;
  details?: Record<string, unknown>;
  userAgent?: string;
}

type Executor = Pick<Db, 'insert'>;

const PAGE_SIZE = 50;

@Injectable()
export class AuditLogService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Records an entry; pass the transaction to keep it atomic with the change it describes. */
  async record(entry: AuditEntry, executor: Executor = this.db): Promise<void> {
    await executor.insert(adminAuditLog).values({
      ...entry,
      // The API's clock, like the windows that count entries (see AdminAuthService).
      createdAt: new Date(),
      userAgent: entry.userAgent?.slice(0, 300),
    });
  }

  async countSince(action: AdminAction, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(adminAuditLog)
      .where(
        and(
          eq(adminAuditLog.action, action),
          gt(adminAuditLog.createdAt, since),
        ),
      );
    return row?.total ?? 0;
  }

  /** Whether a sign-in (or a confirmation) already used this TOTP step: codes work once. */
  async totpStepUsed(step: number): Promise<boolean> {
    const [row] = await this.db
      .select({ total: count() })
      .from(adminAuditLog)
      .where(sql`(${adminAuditLog.details} ->> 'totpStep')::bigint = ${step}`);
    return (row?.total ?? 0) > 0;
  }

  /** Newest first; `before` is the createdAt of the last entry of the previous page. */
  async list(
    options: { before?: string; targetId?: string } = {},
  ): Promise<AuditLogDto> {
    const rows = await this.db
      .select()
      .from(adminAuditLog)
      .where(
        and(
          options.before
            ? lt(adminAuditLog.createdAt, new Date(options.before))
            : undefined,
          options.targetId
            ? eq(adminAuditLog.targetId, options.targetId)
            : undefined,
        ),
      )
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(PAGE_SIZE + 1);
    const page = rows.slice(0, PAGE_SIZE);
    return {
      entries: page.map(toAuditEntryDto),
      nextBefore:
        rows.length > PAGE_SIZE
          ? page[page.length - 1]!.createdAt.toISOString()
          : null,
    };
  }
}

export function toAuditEntryDto(
  row: typeof adminAuditLog.$inferSelect,
): AuditEntryDto {
  return {
    id: row.id,
    action: row.action,
    summary: row.summary,
    targetType: row.targetType,
    targetId: row.targetId,
    details: row.details,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  };
}
