import { existsSync } from 'node:fs';
import type { NextConfig } from 'next';

// The monorepo keeps a single .env at the root; Next only reads its own folder.
if (existsSync('../../.env')) {
  process.loadEnvFile('../../.env');
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ['@vendeu/api-client'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
