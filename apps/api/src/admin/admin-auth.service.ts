import { createHash, timingSafeEqual } from 'node:crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyPassword } from '../auth/password.js';
import { ADMIN_SETTINGS, type AdminSettings } from './admin-settings.js';
import { AdminSessionsService } from './admin-sessions.service.js';
import { AuditLogService } from './audit-log.service.js';
import type { AdminLoginDto } from './dto/admin.dto.js';
import { matchTotp } from './totp.js';

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
/** Failed sign-ins in the window before every attempt is refused until it passes. */
const MAX_FAILURES = 5;

const WRONG_CREDENTIALS = 'Usuário, senha ou código incorretos.';

const sha256 = (value: string) => createHash('sha256').update(value).digest();

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(ADMIN_SETTINGS) private readonly settings: AdminSettings,
    private readonly sessions: AdminSessionsService,
    private readonly audit: AuditLogService,
  ) {}

  /**
   * Checks username, password and TOTP code and starts a session. Failures are counted in
   * the audit log, which every API instance shares, and lock sign-in for a while.
   */
  async login(input: AdminLoginDto, userAgent?: string): Promise<string> {
    const credentials = this.settings.credentials!;
    const failures = await this.audit.countSince(
      'login_failed',
      new Date(Date.now() - LOCKOUT_WINDOW_MS),
    );
    if (failures >= MAX_FAILURES) {
      throw new HttpException(
        'Muitas tentativas. Espere 15 minutos para tentar de novo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Every check runs whatever the others say, so timing tells nothing about which failed.
    const usernameOk = timingSafeEqual(
      sha256(input.username),
      sha256(credentials.username),
    );
    const passwordOk = await verifyPassword(
      input.password,
      credentials.passwordHash,
    );
    const step = matchTotp(credentials.totpSecret, input.code);
    const fresh = step !== null && !(await this.audit.totpStepUsed(step));

    if (!usernameOk || !passwordOk || !fresh) {
      await this.audit.record({
        action: 'login_failed',
        summary: 'Tentativa de entrar recusada',
        // Which part failed, never what was typed.
        details: {
          usernameOk,
          passwordOk,
          codeOk: step !== null,
          codeReused: step !== null && !fresh,
        },
        userAgent,
      });
      throw new UnauthorizedException(WRONG_CREDENTIALS);
    }

    await this.audit.record({
      action: 'login_succeeded',
      summary: 'Entrou no admin',
      details: { totpStep: step },
      userAgent,
    });
    return this.sessions.create(userAgent);
  }

  /** For dangerous actions: a fresh TOTP code, which is then spent. */
  async confirmWithCode(code: string | undefined): Promise<number> {
    const step = code
      ? matchTotp(this.settings.credentials!.totpSecret, code)
      : null;
    if (step === null || (await this.audit.totpStepUsed(step))) {
      throw new ForbiddenException(
        'Confirme com um código novo do app autenticador.',
      );
    }
    return step;
  }
}
