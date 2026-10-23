import { createHash, randomInt } from 'node:crypto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { loginCodes, users } from '../database/schema/index.js';
import { loadEnv } from '../env.js';
import type { AuthUser } from './current-user.decorator.js';
import { EmailSender } from './email-sender.js';
import { verifyGoogleCredential } from './google-credential.js';
import { loginCodeEmail } from './login-email.js';

const CODE_TTL_MS = 10 * 60 * 1000;
/** Codes one email can request per window. */
const MAX_CODES_PER_WINDOW = 5;
const CODE_WINDOW_MS = 15 * 60 * 1000;
/** Wrong guesses allowed across an email's valid codes. */
const MAX_CODE_ATTEMPTS = 5;

const hashCode = (email: string, code: string) =>
  createHash('sha256').update(`${email}:${code}`).digest('hex');

@Injectable()
export class AuthService {
  private readonly googleClientId = loadEnv().GOOGLE_CLIENT_ID;

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly email: EmailSender,
  ) {}

  get googleClientIdOrNull(): string | null {
    return this.googleClientId ?? null;
  }

  async requestCode(email: string): Promise<void> {
    const [{ recent } = { recent: 0 }] = await this.db
      .select({ recent: sql<number>`count(*)::int` })
      .from(loginCodes)
      .where(
        and(
          eq(loginCodes.email, email),
          gt(loginCodes.createdAt, new Date(Date.now() - CODE_WINDOW_MS)),
        ),
      );
    if (recent >= MAX_CODES_PER_WINDOW) {
      throw new HttpException(
        'Você pediu muitos códigos. Espere alguns minutos e tente de novo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.db.insert(loginCodes).values({
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    await this.email.send(loginCodeEmail(email, code));
  }

  /**
   * Any of the email's valid codes works, so an earlier email arriving late after
   * "resend" still signs the person in. Creates the account on first sign-in.
   */
  async verifyCode(email: string, code: string): Promise<AuthUser> {
    const valid = await this.db
      .select()
      .from(loginCodes)
      .where(
        and(
          eq(loginCodes.email, email),
          isNull(loginCodes.consumedAt),
          gt(loginCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(loginCodes.createdAt));

    const [latest] = valid;
    if (!latest) {
      throw new BadRequestException('Esse código expirou. Peça um novo.');
    }
    const attempts = valid.reduce((sum, row) => sum + row.attempts, 0);
    if (attempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException(
        'Muitas tentativas com esse código. Peça um novo.',
      );
    }

    const hash = hashCode(email, code);
    if (!valid.some((row) => row.codeHash === hash)) {
      await this.db
        .update(loginCodes)
        .set({ attempts: sql`${loginCodes.attempts} + 1` })
        .where(eq(loginCodes.id, latest.id));
      throw new BadRequestException(
        'Código incorreto. Confira e tente de novo.',
      );
    }

    await this.db
      .update(loginCodes)
      .set({ consumedAt: new Date() })
      .where(
        inArray(
          loginCodes.id,
          valid.map((row) => row.id),
        ),
      );
    return this.findOrCreateByEmail(email);
  }

  async signInWithGoogle(credential: string): Promise<AuthUser> {
    if (!this.googleClientId) throw new NotFoundException();

    const identity = await verifyGoogleCredential(
      credential,
      this.googleClientId,
    );
    if (!identity) {
      throw new UnauthorizedException(
        'Não conseguimos confirmar sua conta Google. Tente de novo.',
      );
    }

    const [byGoogle] = await this.db
      .select()
      .from(users)
      .where(eq(users.googleSub, identity.sub))
      .limit(1);
    if (byGoogle) return byGoogle;

    // Same person who signed in by email before: link the Google account to it.
    const user = await this.findOrCreateByEmail(identity.email, identity.name);
    const [linked] = await this.db
      .update(users)
      .set({ googleSub: identity.sub, name: user.name ?? identity.name })
      .where(eq(users.id, user.id))
      .returning();
    return linked ?? user;
  }

  private async findOrCreateByEmail(
    email: string,
    name?: string,
  ): Promise<AuthUser> {
    // The no-op update makes the upsert return the existing row too.
    const [user] = await this.db
      .insert(users)
      .values({ email, name })
      .onConflictDoUpdate({ target: users.email, set: { email } })
      .returning();
    if (!user) throw new Error(`Upsert returned no user for ${email}`);
    return user;
  }
}
