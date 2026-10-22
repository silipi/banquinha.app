import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export function createDb(databaseUrl: string) {
  return drizzle(postgres(databaseUrl), { schema });
}

export type Db = ReturnType<typeof createDb>;
