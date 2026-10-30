import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { IS_ADMIN_ROUTE } from '../admin/admin-route.decorator.js';
import { IS_PUBLIC } from './public.decorator.js';
import { SESSION_COOKIE } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

/**
 * Global guard: every route needs a merchant session unless marked @Public(). Platform admin
 * routes are AdminGuard's: they take an admin session, never a merchant one.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }
    if (this.reflector.getAllAndOverride<boolean>(IS_ADMIN_ROUTE, targets)) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: unknown }>();
    const token = request.cookies[SESSION_COOKIE];
    const user = token ? await this.sessions.findUser(token) : null;
    if (!user) {
      throw new UnauthorizedException('Entre na sua conta para continuar.');
    }
    request.user = user;
    return true;
  }
}
