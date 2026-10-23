import { createHash, randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
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
import { passwordResetCodes, users } from '../database/schema/index.js';
import { loadEnv } from '../env.js';
import type { AuthUser } from './current-user.decorator.js';
import type { SignupDto } from './dto/auth.dto.js';
import { EmailSender } from './email-sender.js';
import { verifyGoogleCredential } from './google-credential.js';
import { LoginAttempts } from './login-attempts.js';
import { hashPassword, verifyPassword } from './password.js';
import { passwordResetEmail } from './password-reset-email.js';
import { SessionsService } from './sessions.service.js';

const CODE_TTL_MS = 15 * 60 * 1000;
/** Codes one account can request per window. */
const MAX_CODES_PER_WINDOW = 5;
const CODE_WINDOW_MS = 15 * 60 * 1000;
/** Wrong guesses allowed across an account's valid codes. */
const MAX_CODE_ATTEMPTS = 5;

const WRONG_CREDENTIALS = 'E-mail ou senha incorretos.';
const CODE_EXPIRED = 'Esse código expirou. Peça um novo.';

const hashCode = (userId: string, code: string) =>
  createHash('sha256').update(`${userId}:${code}`).digest('hex');

@Injectable()
export class AuthService {
  private readonly googleClientId = loadEnv().GOOGLE_CLIENT_ID;

  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly email: EmailSender,
    private readonly loginAttempts: LoginAttempts,
    private readonly sessions: SessionsService,
  ) {}

  get googleClientIdOrNull(): string | null {
    return this.googleClientId ?? null;
  }

  async signup(input: SignupDto): Promise<AuthUser> {
    const [user] = await this.db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        whatsapp: input.whatsapp,
        passwordHash: await hashPassword(input.password),
      })
      .onConflictDoNothing({ target: users.email })
      .returning();
    if (!user) {
      throw new ConflictException(
        'Já existe uma conta com esse e-mail. Entre ou crie uma nova senha.',
      );
    }
    return user;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    this.loginAttempts.assertAllowed(email);

    const user = await this.findByEmail(email);
    const valid =
      user?.passwordHash != null &&
      (await verifyPassword(password, user.passwordHash));
    if (!user || !valid) {
      this.loginAttempts.recordFailure(email);
      throw new UnauthorizedException(WRONG_CREDENTIALS);
    }

    this.loginAttempts.clear(email);
    return user;
  }

  /** Emails a 6-digit code. Silent when there is no account, so emails can't be probed. */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) return;

    const [{ recent } = { recent: 0 }] = await this.db
      .select({ recent: sql<number>`count(*)::int` })
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.userId, user.id),
          gt(
            passwordResetCodes.createdAt,
            new Date(Date.now() - CODE_WINDOW_MS),
          ),
        ),
      );
    if (recent >= MAX_CODES_PER_WINDOW) {
      throw new HttpException(
        'Você pediu muitos códigos. Espere alguns minutos e tente de novo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.db.insert(passwordResetCodes).values({
      userId: user.id,
      codeHash: hashCode(user.id, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    await this.email.send(passwordResetEmail(email, code));
  }

  /**
   * Sets a new password and ends every other session. Any of the account's valid codes
   * works, so an earlier email arriving late after "resend" still does.
   */
  async resetPassword(
    email: string,
    code: string,
    password: string,
  ): Promise<AuthUser> {
    const user = await this.findByEmail(email);
    if (!user) throw new BadRequestException(CODE_EXPIRED);

    const valid = await this.db
      .select()
      .from(passwordResetCodes)
      .where(
        and(
          eq(passwordResetCodes.userId, user.id),
          isNull(passwordResetCodes.consumedAt),
          gt(passwordResetCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(passwordResetCodes.createdAt));

    const [latest] = valid;
    if (!latest) throw new BadRequestException(CODE_EXPIRED);
    const attempts = valid.reduce((sum, row) => sum + row.attempts, 0);
    if (attempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException(
        'Muitas tentativas com esse código. Peça um novo.',
      );
    }

    const hash = hashCode(user.id, code);
    if (!valid.some((row) => row.codeHash === hash)) {
      await this.db
        .update(passwordResetCodes)
        .set({ attempts: sql`${passwordResetCodes.attempts} + 1` })
        .where(eq(passwordResetCodes.id, latest.id));
      throw new BadRequestException(
        'Código incorreto. Confira e tente de novo.',
      );
    }

    await this.db
      .update(passwordResetCodes)
      .set({ consumedAt: new Date() })
      .where(
        inArray(
          passwordResetCodes.id,
          valid.map((row) => row.id),
        ),
      );
    const [updated] = await this.db
      .update(users)
      .set({ passwordHash: await hashPassword(password) })
      .where(eq(users.id, user.id))
      .returning();
    await this.sessions.deleteAllForUser(user.id);
    this.loginAttempts.clear(email);
    return updated ?? user;
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

    // Signs up, or links Google to an account that signed up with the same email.
    // The no-op update makes the upsert return the existing row too.
    const [user] = await this.db
      .insert(users)
      .values({ email: identity.email, name: identity.name })
      .onConflictDoUpdate({
        target: users.email,
        set: { email: identity.email },
      })
      .returning();
    if (!user) throw new Error(`Upsert returned no user for ${identity.email}`);

    const [linked] = await this.db
      .update(users)
      .set({ googleSub: identity.sub, name: user.name ?? identity.name })
      .where(eq(users.id, user.id))
      .returning();
    return linked ?? user;
  }

  private async findByEmail(email: string): Promise<AuthUser | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }
}
