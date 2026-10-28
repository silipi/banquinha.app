import type { Instrumentation } from 'next';

/**
 * Reports server-side rendering, route and action errors to PostHog error tracking.
 * Off when NEXT_PUBLIC_POSTHOG_KEY is unset.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { PostHog } = await import('posthog-node');
  const posthog = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined,
    flushAt: 1,
    flushInterval: 0,
  });
  await posthog
    .captureExceptionImmediate(error, undefined, {
      $request_method: request.method,
      // Route file pattern, not the URL: no store handles or query strings.
      $request_path: context.routePath,
      route_type: context.routeType,
    })
    .catch(() => {});
  await posthog.shutdown();
};
