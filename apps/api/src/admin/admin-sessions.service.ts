import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, lt, or } from 'drizzle-orm';
import { generateSessionToken, hashToken } from '../auth/session-cookie.js';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { adminSessions } from '../database/schema/index.js';
import {
  ADMIN_SESSION_IDLE_MS,
  ADMIN_SESSION_TTL_MS,
} from './admin-session-cookie.js';

// lastSeenAt is written at most this often, not on every request.
const TOUCH_EVERY_MS = 60 * 1000;

export type AdminSession = typeof adminSessions.$inferSelect;

@Injectable()
export class AdminSessionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Starts a session and returns the token for the cookie. Clears ended sessions on the way. */
  async create(userAgent: string | undefined): Promise<string> {
    const now = Date.now();
    await this.db
      .delete(adminSessions)
      .where(
        or(
          lt(adminSessions.expiresAt, new Date(now)),
          lt(adminSessions.lastSeenAt, new Date(now - ADMIN_SESSION_IDLE_MS)),
        ),
      );
    const token = generateSessionToken();
    await this.db.insert(adminSessions).values({
      tokenHash: hashToken(token),
      expiresAt: new Date(now + ADMIN_SESSION_TTL_MS),
      lastSeenAt: new Date(now),
      userAgent: userAgent?.slice(0, 300),
    });
    return token;
  }

  /** The session if it is still valid, keeping it alive. */
  async find(token: string): Promise<AdminSession | null> {
    const now = Date.now();
    const [session] = await this.db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.tokenHash, hashToken(token)),
          gt(adminSessions.expiresAt, new Date(now)),
          gt(adminSessions.lastSeenAt, new Date(now - ADMIN_SESSION_IDLE_MS)),
        ),
      )
      .limit(1);
    if (!session) return null;
    if (now - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
      await this.db
        .update(adminSessions)
        .set({ lastSeenAt: new Date(now) })
        .where(eq(adminSessions.id, session.id));
    }
    return session;
  }

  async delete(token: string): Promise<void> {
    await this.db
      .delete(adminSessions)
      .where(eq(adminSessions.tokenHash, hashToken(token)));
  }
}
