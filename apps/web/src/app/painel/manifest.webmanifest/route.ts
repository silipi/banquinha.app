// Web app manifest of the merchant area, so it installs like an app on the phone.
// The area is the whole app. host, or /painel on the site before the custom domain, so
// the start URL and scope depend on the host that serves it.
export function GET(request: Request) {
  const host = request.headers.get('host') ?? '';
  const base = host.startsWith('minha.') ? '/' : '/painel/';

  const manifest = {
    id: base,
    name: 'banquinha.app · Painel',
    short_name: 'banquinha',
    description: 'Cuide da sua loja: produtos, pedidos e vitrine.',
    lang: 'pt-BR',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf7f2',
    theme_color: '#faf7f2',
    icons: [
      {
        src: '/painel/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/painel/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
