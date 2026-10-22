import { existsSync } from 'node:fs';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  API_PORT: z.coerce.number().default(3333),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  // In dev the .env lives at the monorepo root. In production the host provides the variables.
  if (process.env.NODE_ENV !== 'production' && existsSync('../../.env')) {
    process.loadEnvFile('../../.env');
  }
  return envSchema.parse(process.env);
}
