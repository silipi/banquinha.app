import { existsSync } from 'node:fs';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  API_PORT: z.coerce.number().default(3333),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  /** Orders accepted per client IP per minute. */
  ORDER_RATE_LIMIT: z.coerce.number().int().positive().default(5),
  /**
   * Shared secret the web app sends with server-to-server calls. Only requests carrying it
   * may say which end-user IP they act for (see OrderThrottlerGuard).
   */
  INTERNAL_API_KEY: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // In dev the .env lives at the monorepo root. In production the host provides the variables.
  if (process.env.NODE_ENV !== 'production' && existsSync('../../.env')) {
    process.loadEnvFile('../../.env');
  }
  return envSchema.parse(process.env);
}
