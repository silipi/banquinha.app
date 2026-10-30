import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC } from '../auth/public.decorator.js';
import { IS_ADMIN_ROUTE } from './admin-route.decorator.js';
import { ADMIN_SESSION_COOKIE } from './admin-session-cookie.js';
import { ADMIN_SETTINGS, type AdminSettings } from './admin-settings.js';
import { AdminSessionsService } from './admin-sessions.service.js';

/** Global guard for @AdminRoute() controllers: they need an admin session. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: AdminSessionsService,
    @Inject(ADMIN_SETTINGS) private readonly settings: AdminSettings,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (!this.reflector.getAllAndOverride<boolean>(IS_ADMIN_ROUTE, targets)) {
      return true;
    }
    // Without credentials the panel does not exist, sign-in included.
    if (!this.settings.credentials) throw new NotFoundException();
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies[ADMIN_SESSION_COOKIE];
    const session = token ? await this.sessions.find(token) : null;
    if (!session) throw new UnauthorizedException('Sessão de admin expirada.');
    return true;
  }
}
