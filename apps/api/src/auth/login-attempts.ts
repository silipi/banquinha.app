import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

/**
 * Wrong passwords per email, to slow down guessing. Kept in memory like the order
 * limit, which holds while the API runs as a single instance (see ROADMAP P3-01).
 * Counted per email because behind the web's /api proxy every request shares an IP.
 */
@Injectable()
export class LoginAttempts {
  private readonly failures = new Map<string, number[]>();

  assertAllowed(email: string): void {
    if (this.recent(email).length >= MAX_FAILURES) {
      throw new HttpException(
        'Muitas tentativas de entrar. Espere alguns minutos ou crie uma nova senha.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(email: string): void {
    this.failures.set(email, [...this.recent(email), Date.now()]);
  }

  clear(email: string): void {
    this.failures.delete(email);
  }

  private recent(email: string): number[] {
    const since = Date.now() - WINDOW_MS;
    return (this.failures.get(email) ?? []).filter((at) => at > since);
  }
}
