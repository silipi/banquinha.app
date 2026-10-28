import { trackNavigation } from '@/lib/analytics';

trackNavigation(new URL(window.location.href));

export function onRouterTransitionStart(url: string) {
  trackNavigation(new URL(url, window.location.href));
}
