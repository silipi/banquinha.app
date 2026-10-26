import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';

describe('Storefront', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  describe('GET /storefront/:handle', () => {
    it("renders with the theme's tokens plus the store's overrides", async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/luluca',
      });
      // Background and radius from the Docinho theme; the accent is Luluca's own.
      expect(res.json().theme).toMatchObject({
        version: 1,
        colors: { background: '#fcf4f7', accent: '#7c5cbf' },
        radius: 'large',
      });
    });

    it('returns the store with its products in display order', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/pauloplantas',
      });
      expect(res.statusCode).toBe(200);

      const store = res.json();
      expect(store).toMatchObject({
        handle: 'pauloplantas',
        name: 'Plantinhas do Paulo',
        logoUrl: '/lojas/pauloplantas/logo.webp',
        contact: { whatsapp: '5545999158412', instagram: 'banquinhaapp' },
      });
      expect(store.products).toHaveLength(6);
      expect(store.products[0]).toEqual({
        slug: 'costela-de-adao',
        name: 'Costela-de-Adão',
        kind: 'product',
        priceType: 'fixed',
        priceCents: 4500,
        imageUrl: '/lojas/pauloplantas/costela-de-adao.webp',
      });
    });

    it('matches the handle case-insensitively', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/PauloPlantas',
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 with a user-facing message for an unknown store', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/nao-existe',
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ message: 'Loja não encontrada' });
    });
  });

  describe('GET /storefront/:handle/products/:slug', () => {
    it('returns the product with its images and store summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/clarajoias/products/colar-aurora',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        slug: 'colar-aurora',
        name: 'Colar Aurora',
        priceCents: 21900,
        images: [{ url: '/lojas/clarajoias/colar-aurora.webp' }],
        store: { handle: 'clarajoias', name: 'Clara Joias' },
      });
    });

    it('does not find a product through another store', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/luluca/products/colar-aurora',
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ message: 'Produto não encontrado' });
    });

    it('returns 404 for an unknown store', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/nao-existe/products/colar-aurora',
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /sitemap/storefronts', () => {
    it('lists stores with their active product slugs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/sitemap/storefronts',
      });
      expect(res.statusCode).toBe(200);

      const paulo = res
        .json()
        .find((store: { handle: string }) => store.handle === 'pauloplantas');
      expect(paulo.products).toHaveLength(6);
      expect(paulo.products[0]).toEqual({
        slug: 'costela-de-adao',
        updatedAt: expect.any(String),
      });
    });
  });
});
