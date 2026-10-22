import { defineConfig } from '@hey-api/openapi-ts';

// The contract comes from the API (apps/api/openapi.json, written by `pnpm --filter @vendeu/api openapi`).
export default defineConfig({
  input: '../../apps/api/openapi.json',
  // Extensionless imports: the package is consumed as TS source by Next (bundler resolution).
  output: { path: 'src/generated', importFileExtension: null },
  plugins: ['@hey-api/client-next', '@hey-api/typescript', '@hey-api/sdk'],
});
