// Applies the migrations in ./drizzle (`pnpm db:migrate`). Same migrator and bookkeeping
// table as drizzle-kit, but it prints the database's error when one fails: drizzle-kit
// only exits with code 1. Runs with Node's built-in TypeScript support, no build needed.
import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

if (!process.env.DATABASE_URL && existsSync('../../.env')) {
  process.loadEnvFile('../../.env');
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(client), { migrationsFolder: './drizzle' });
  console.log('Migrations applied');
} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
