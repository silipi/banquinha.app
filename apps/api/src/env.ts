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
  /**
   * Cloudflare R2 bucket for uploaded images. Without it, uploads are written to UPLOADS_DIR
   * in development and refused in production.
   */
  R2_ACCOUNT_ID: optional(z.string()),
  R2_ACCESS_KEY_ID: optional(z.string()),
  R2_SECRET_ACCESS_KEY: optional(z.string()),
  R2_BUCKET: optional(z.string()),
  /** Public origin the bucket is served from (custom domain or r2.dev), no trailing slash. */
  R2_PUBLIC_URL: optional(z.url()),
  /** Local folder for uploads when R2 is not configured. */
  UPLOADS_DIR: z.string().default('.uploads'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // In dev the .env lives at the monorepo root. In production the host provides the variables.
  if (process.env.NODE_ENV !== 'production' && existsSync('../../.env')) {
    process.loadEnvFile('../../.env');
  }
  return envSchema.parse(process.env);
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

/** The R2 settings when all of them are set; throws when only some are. */
export function r2Config(env: Env): R2Config | null {
  const values = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
    publicUrl: env.R2_PUBLIC_URL?.replace(/\/+$/, ''),
  };
  const set = Object.values(values).filter(Boolean).length;
  if (set === 0) return null;
  if (set < Object.keys(values).length) {
    throw new Error(
      'Set all of R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL, or none',
    );
  }
  return values as R2Config;
}
