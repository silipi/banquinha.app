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
  // The default bottom-left spot covers the storefront's floating bag button.
  devIndicators: { position: 'bottom-right' },
  // Share images read these fonts from disk at runtime (src/lib/og.tsx).
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-{400,700}-normal.woff',
    ],
  },
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
