import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiDocument, createApp } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const app = await createApp({ trustProxyHops: env.TRUST_PROXY_HOPS });

app.enableCors({ origin: env.WEB_ORIGIN, credentials: true });
app.enableShutdownHooks();
SwaggerModule.setup('docs', app, () => buildOpenApiDocument(app));

await app.listen(env.API_PORT, '0.0.0.0');
