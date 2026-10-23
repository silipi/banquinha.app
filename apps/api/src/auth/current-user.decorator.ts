import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { users } from '../database/schema/index.js';

export type AuthUser = typeof users.$inferSelect;

/** The signed-in merchant, set by AuthGuard. Only use on routes that are not @Public(). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
