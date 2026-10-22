// Entry point for `pnpm db:seed`. Runs from dist/ after a build.
import { loadEnv } from '../../env.js';
import { createDb } from '../database.js';
import { seedExampleStores } from './seed.js';

const db = createDb(loadEnv().DATABASE_URL);
await seedExampleStores(db);
await db.$client.end();
console.log('Seeded example stores.');
