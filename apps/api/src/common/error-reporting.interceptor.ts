import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { PostHog } from 'posthog-node';
import { catchError, from, mergeMap, type Observable, throwError } from 'rxjs';

/**
 * Reports unexpected errors (anything that would become a 5xx) to PostHog error
 * tracking. The report is sent before the error response, because Cloud Run stops
 * giving the instance CPU once a request is answered.
 */
export class ErrorReportingInterceptor implements NestInterceptor {
  constructor(private readonly posthog: PostHog) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    return next
      .handle()
      .pipe(
        catchError((error: unknown) =>
          from(this.report(error, request)).pipe(
            mergeMap(() => throwError(() => error)),
          ),
        ),
      );
  }

  private async report(error: unknown, request: FastifyRequest) {
    if (error instanceof HttpException && error.getStatus() < 500) return;
    await this.posthog
      .captureExceptionImmediate(error, undefined, {
        $request_method: request.method,
        // Route pattern, not the URL: no handles, ids or query strings.
        $request_path: request.routeOptions.url,
      })
      .catch(() => {});
  }
}
