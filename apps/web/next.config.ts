import { existsSync } from 'node:fs';
import createMDX from '@next/mdx';
import type { NextConfig } from 'next';

// The monorepo keeps a single .env at the root; Next only reads its own folder.
if (existsSync('../../.env')) {
  process.loadEnvFile('../../.env');
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
// Merchant area origin (app.banquinha.app). Unset before the custom domain: then the
// area is reached at /painel on the site's own host.
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
// Public origin of the R2 bucket with uploaded images. Unset in development, where the API
// keeps uploads on disk and serves them under /api/uploads (a local path, allowed by default).
const imagesUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ['@banquinha/api-client'],
  // Uploads are served with a one-year immutable Cache-Control, which next/image honors.
  images: {
    remotePatterns: imagesUrl ? [new URL(`${imagesUrl}/stores/**`)] : [],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Browser calls from the merchant area go through here, so the API's session
        // cookie is first-party and needs no CORS.
        { source: '/api/:path*', destination: `${apiUrl}/:path*` },
        // app.<domain>/x is served by src/app/painel/x.
        {
          source: '/:path((?!api/|_next/|favicon\\.ico).*)',
          has: [{ type: 'host', value: 'app\\..+' }],
          destination: '/painel/:path',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    // The landing's "create store" buttons land on the merchant area's sign-up.
    return [
      {
        source: '/cadastro',
        // On the merchant host itself, /cadastro is the sign-up page.
        missing: [{ type: 'host', value: 'app\\..+' }],
        destination: appUrl ? `${appUrl}/cadastro` : '/painel/cadastro',
        permanent: false,
      },
    ];
  },
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

// Blog posts live in src/content/blog/*.mdx. Turbopack needs plugins referenced by name.
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: ['rehype-slug'],
  },
});

export default withMDX(nextConfig);
