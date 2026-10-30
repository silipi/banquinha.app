import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { sessions, users } from '../database/schema/index.js';
import { effectivePlan } from '../plans/plans.js';
import type { AuthUser } from './current-user.decorator.js';
import {
  SESSION_TTL_MS,
  generateSessionToken,
  hashToken,
} from './session-cookie.js';

@Injectable()
export class SessionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Starts a session and returns the token for the cookie. */
  async create(userId: string): Promise<string> {
    const token = generateSessionToken();
    await this.db.insert(sessions).values({
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    return token;
  }

  /**
   * The session's merchant, with `plan` already resolved to the plan whose limits apply
   * (see effectivePlan), so services can read `user.plan` directly.
   */
  async findUser(token: string): Promise<AuthUser | null> {
    const [row] = await this.db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.tokenHash, hashToken(token)),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ? { ...row.user, plan: effectivePlan(row.user) } : null;
  }

  async delete(token: string): Promise<void> {
    await this.db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }

  /** Signs the account out everywhere, e.g. after a password change. */
  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
