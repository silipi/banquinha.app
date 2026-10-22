// Writes apps/api/openapi.json, the source of the @vendeu/api-client types.
import { writeFileSync } from 'node:fs';
import { buildOpenApiDocument, createApp } from './app.js';

const app = await createApp();
const document = buildOpenApiDocument(app);
writeFileSync('openapi.json', JSON.stringify(document, null, 2) + '\n');
await app.close();
