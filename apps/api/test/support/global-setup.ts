import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../src/database/schema/index.js';
import { seedExampleStores } from '../../src/database/seed/seed.js';
import { testDatabaseUrl } from './test-database.js';

/** Creates the e2e database if needed, applies migrations and loads the example stores. */
export default async function setup() {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = postgres(adminUrl.toString(), { onnotice: () => {} });
  const [existing] =
    await admin`select 1 from pg_database where datname = ${name}`;
  if (!existing) await admin.unsafe(`create database "${name}"`);
  await admin.end();

  // Migrations re-run on every test run; their "already exists" notices are noise.
  const db = drizzle(postgres(url, { onnotice: () => {} }), { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await seedExampleStores(db);
  // Admin sign-ins count earlier attempts and spent codes: every run starts clean.
  await db.execute(sql`truncate admin_audit_log, admin_sessions`);
  await db.$client.end();
}
