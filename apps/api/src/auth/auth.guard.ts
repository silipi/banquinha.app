import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC } from './public.decorator.js';
import { SESSION_COOKIE } from './session-cookie.js';
import { SessionsService } from './sessions.service.js';

/** Global guard: every route needs a merchant session unless marked @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

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
