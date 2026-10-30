import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../auth/public.decorator.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminRoute } from './admin-route.decorator.js';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from './admin-session-cookie.js';
import { ADMIN_SETTINGS, type AdminSettings } from './admin-settings.js';
import { AdminSessionsService } from './admin-sessions.service.js';
import { AuditLogService } from './audit-log.service.js';
import { AdminLoginDto, AdminMeDto } from './dto/admin.dto.js';

/** Platform admin sign-in. The whole /admin tree answers 404 when the admin is not configured. */
@AdminRoute()
@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly sessions: AdminSessionsService,
    private readonly audit: AuditLogService,
    @Inject(ADMIN_SETTINGS) private readonly settings: AdminSettings,
  ) {}

  /** Username, password and TOTP code. 401 on any mistake, 429 after too many. */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: AdminLoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AdminMeDto> {
    const token = await this.auth.login(body, userAgent);
    reply.setCookie(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    const session = await this.sessions.find(token);
    return this.toMe(session!.expiresAt);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: FastifyRequest,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const token = request.cookies[ADMIN_SESSION_COOKIE];
    if (token) await this.sessions.delete(token);
    await this.audit.record({ action: 'logout', summary: 'Saiu', userAgent });
    reply.clearCookie(ADMIN_SESSION_COOKIE, adminSessionCookieOptions());
  }

  /** The current session; 401 when signed out. */
  @Get('me')
  async me(@Req() request: FastifyRequest): Promise<AdminMeDto> {
    const session = await this.sessions.find(
      request.cookies[ADMIN_SESSION_COOKIE]!,
    );
    if (!session) throw new UnauthorizedException();
    return this.toMe(session.expiresAt);
  }

  private toMe(expiresAt: Date): AdminMeDto {
    return {
      environment: this.settings.environment,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
