import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/support/test-database.js';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/support/global-setup.ts'],
    // High order limit so tests can place many orders; the limit has its own spec.
    // Uploads go to a temp folder (no R2 in tests).
    env: {
      DATABASE_URL: testDatabaseUrl(),
      ORDER_RATE_LIMIT: '1000',
      UPLOADS_DIR: join(tmpdir(), 'banquinha-test-uploads'),
    },
  },
});
