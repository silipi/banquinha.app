import { timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import { loadEnv } from '../env.js';

/** Header with the shared secret the web app sends on server-to-server calls. */
export const INTERNAL_KEY_HEADER = 'x-internal-key';
/** Header with the end user's IP, trusted only next to a valid internal key. */
export const CLIENT_IP_HEADER = 'x-client-ip';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Limits orders per end user. Orders reach the API through the web app's server, so
 * the connection IP is the web server's; the web forwards the customer's IP together
 * with the internal key. Anyone else is tracked by their own connection IP.
 */
@Injectable()
export class OrderThrottlerGuard extends ThrottlerGuard {
  private readonly internalKey = loadEnv().INTERNAL_API_KEY;

  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const headers = req.headers as Record<string, string | undefined>;
    const key = headers[INTERNAL_KEY_HEADER];
    const clientIp = headers[CLIENT_IP_HEADER];

    if (
      this.internalKey &&
      key &&
      clientIp &&
      safeEqual(key, this.internalKey)
    ) {
      return clientIp;
    }
    return req.ip as string;
  }

  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<{ url: string }>();
    this.logger.warn(`Order rate limit hit by ${detail.tracker} on ${req.url}`);
    return super.throwThrottlingException(context, detail);
  }
}
