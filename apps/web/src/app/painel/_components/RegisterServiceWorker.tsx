'use client';

import { useEffect } from 'react';
import { panelPath } from '@/lib/panel';

/**
 * Registers the merchant area's service worker (public/painel/sw.js) so it can be
 * installed and opens offline. Production only: in development it would cache builds.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    // /sw.js on the app. host (rewritten to /painel/sw.js, scope "/"), /painel/sw.js elsewhere.
    navigator.serviceWorker.register(panelPath('/sw.js')).catch(() => {});
  }, []);
  return null;
}
