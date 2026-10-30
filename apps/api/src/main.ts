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
SwaggerModule.setup('docs', app, () => {
  const document = buildOpenApiDocument(app);
  // The public docs of production do not map out the admin panel (the client still has it).
  if (env.APP_ENV === 'production') {
    for (const path of Object.keys(document.paths)) {
      if (path.startsWith('/admin/')) delete document.paths[path];
    }
  }
  return document;
});

await app.listen(env.API_PORT, '0.0.0.0');
