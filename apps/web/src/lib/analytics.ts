import type { PostHog } from 'posthog-js';

/**
 * Product analytics (PostHog) for the platform's own pages: landing, blog, legal pages
 * and the merchant area. Storefronts are never tracked, since their visitors are the
 * merchants' customers: PostHog is not even loaded when a visit starts on one, and its
 * events are dropped while the visitor is on one. Off when NEXT_PUBLIC_POSTHOG_KEY is
 * unset.
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// First path segments of the platform's pages on the site host. Everything else at the
// root is a storefront (see PLATFORM_ROOT_PATHS in the API).
const TRACKED_ROOTS = new Set([
  '',
  'blog',
  'cadastro',
  'painel',
  'privacidade',
  'termos',
]);

export function isTrackedUrl(url: URL) {
  if (url.hostname.startsWith('minha.')) return true;
  return TRACKED_ROOTS.has(url.pathname.split('/')[1] ?? '');
}

let loading: Promise<PostHog> | null = null;

/** Loads and starts PostHog on a tracked page; null when analytics is off. */
function load(): Promise<PostHog> | null {
  if (!key) return null;
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      defaults: '2026-08-30',
      person_profiles: 'identified_only',
      capture_exceptions: true,
      before_send: (event) => {
        const url = event?.properties.$current_url ?? window.location.href;
        return isTrackedUrl(new URL(url)) ? event : null;
      },
    });
    return posthog;
  });
  return loading;
}

/** Called on page load and on every client-side navigation. */
export function trackNavigation(url: URL) {
  const tracked = isTrackedUrl(url);
  // Never load PostHog for a visit that starts (or stays) on storefronts.
  if (!tracked && !loading) return;
  void load()?.then((posthog) => {
    if (tracked) posthog.startSessionRecording();
    else posthog.stopSessionRecording();
  });
}

/** Ties the session to the signed-in merchant. */
export function identifyMerchant(me: {
  id: string;
  email: string;
  name: string | null;
}) {
  void load()?.then((posthog) =>
    posthog.identify(me.id, { email: me.email, name: me.name }),
  );
}

/** Forgets the merchant on sign-out, so a shared phone starts a fresh visitor. */
export function resetAnalytics() {
  void loading?.then((posthog) => posthog.reset());
}
