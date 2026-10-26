// Service worker of the merchant area (registered by RegisterServiceWorker). It keeps
// the app usable as an installed app: built assets are served from cache, pages always
// come from the network, and without a connection a friendly offline screen shows
// instead of the browser's error page. API calls are never cached.

const CACHE = 'banquinha-panel-v1';

const OFFLINE_PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sem internet · banquinha.app</title>
<style>
  body { margin: 0; min-height: 100dvh; display: flex; align-items: center; justify-content: center;
    background: #faf7f2; color: #1a1714; font: 16px/1.5 system-ui, sans-serif; text-align: center; padding: 24px; }
  h1 { font-size: 24px; margin: 16px 0 8px; }
  p { color: #6b645b; margin: 0 0 24px; }
  button { height: 48px; padding: 0 24px; border: 0; border-radius: 999px; background: #1a1714;
    color: #faf7f2; font: inherit; font-weight: 600; }
  .mark { font-size: 40px; font-weight: 800; }
  .mark span { color: #ff5a1f; }
</style>
</head>
<body>
  <main>
    <div class="mark">b<span>.</span></div>
    <h1>Você está sem internet</h1>
    <p>Assim que a conexão voltar, seu painel abre normalmente.</p>
    <button onclick="location.reload()">Tentar de novo</button>
  </main>
</body>
</html>`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_PAGE, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }),
      ),
    );
    return;
  }

  // Hashed build files never change: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
