import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/support/test-database.js';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/support/global-setup.ts'],
    // High order limit so tests can place many orders; the limit has its own spec.
    env: { DATABASE_URL: testDatabaseUrl(), ORDER_RATE_LIMIT: '1000' },
  },
});
