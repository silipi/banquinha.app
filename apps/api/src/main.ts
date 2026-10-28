import { SwaggerModule } from '@nestjs/swagger';
import { PostHog } from 'posthog-node';
import { buildOpenApiDocument, createApp } from './app.js';
import { ErrorReportingInterceptor } from './common/error-reporting.interceptor.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const app = await createApp({ trustProxyHops: env.TRUST_PROXY_HOPS });

app.enableCors({ origin: env.WEB_ORIGIN, credentials: true });
if (env.POSTHOG_KEY) {
  const posthog = new PostHog(env.POSTHOG_KEY, { host: env.POSTHOG_HOST });
  app.useGlobalInterceptors(new ErrorReportingInterceptor(posthog));
}
app.enableShutdownHooks();
SwaggerModule.setup('docs', app, () => buildOpenApiDocument(app));

await app.listen(env.API_PORT, '0.0.0.0');
