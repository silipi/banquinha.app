import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/support/test-database.js';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/support/global-setup.ts'],
    env: { DATABASE_URL: testDatabaseUrl() },
  },
});
