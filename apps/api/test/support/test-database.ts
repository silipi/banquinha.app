import { existsSync } from 'node:fs';

/** Dev database URL with the database name suffixed by `_test`, so e2e runs never touch dev data. */
export function testDatabaseUrl(): string {
  if (!process.env.DATABASE_URL && existsSync('../../.env')) {
    process.loadEnvFile('../../.env');
  }
  const url = new URL(process.env.DATABASE_URL!);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}
