import { existsSync } from 'node:fs';
import { z } from 'zod';

/** Optional variable where an empty value (`KEY=` in .env) means unset. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  );

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
  INTERNAL_API_KEY: optional(z.string().min(32)),
  /**
   * Proxies in front of the API whose X-Forwarded-For entry is trusted when resolving the
   * client IP. 0 locally; 1 on Cloud Run, whose front end appends the real client IP.
   */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  /** OAuth client id for "Sign in with Google". Google sign-in is off when unset. */
  GOOGLE_CLIENT_ID: optional(z.string()),
  /**
   * Resend API key for password reset emails. Without it, codes are logged in development
   * and password reset is unavailable in production.
   */
  RESEND_API_KEY: optional(z.string()),
  EMAIL_FROM: z.string().default('banquinha.app <oi@banquinha.app>'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // In dev the .env lives at the monorepo root. In production the host provides the variables.
  if (process.env.NODE_ENV !== 'production' && existsSync('../../.env')) {
    process.loadEnvFile('../../.env');
  }
  return envSchema.parse(process.env);
}
