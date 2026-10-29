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
        url: '/storefront/unhasdajessica',
      });
      // Background and radius from the Docinho theme; the accent is Jéssica's own.
      expect(res.json().theme).toMatchObject({
        version: 1,
        colors: { background: '#fcf4f7', accent: '#d6336c' },
        radius: 'large',
      });
    });

    it('returns the store with its products in display order', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/neidebeleza',
      });
      expect(res.statusCode).toBe(200);

      const store = res.json();
      expect(store).toMatchObject({
        handle: 'neidebeleza',
        name: 'Neide Beleza & Casa',
        logoUrl: '/lojas/neidebeleza/logo.webp',
        contact: { whatsapp: '5545999158412', instagram: 'banquinhaapp' },
      });
      expect(store.products).toHaveLength(6);
      expect(store.products[0]).toEqual({
        slug: 'perfume-floral-75ml',
        name: 'Perfume Floral 75 ml',
        kind: 'product',
        priceType: 'fixed',
        priceCents: 8990,
        imageUrl: '/lojas/neidebeleza/perfume-floral-75ml.webp',
        highlights: [],
      });
    });

    it('matches the handle case-insensitively', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/NeideBeleza',
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
        url: '/storefront/zefaztudo/products/instalacao-de-chuveiro',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        slug: 'instalacao-de-chuveiro',
        name: 'Instalação de chuveiro',
        kind: 'service',
        priceCents: 8000,
        images: [{ url: '/lojas/zefaztudo/instalacao-de-chuveiro.webp' }],
        store: { handle: 'zefaztudo', name: 'Zé Faz Tudo' },
      });
    });

    it('does not find a product through another store', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/neidebeleza/products/instalacao-de-chuveiro',
      });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ message: 'Produto não encontrado' });
    });

    it('returns 404 for an unknown store', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/storefront/nao-existe/products/instalacao-de-chuveiro',
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

      const neide = res
        .json()
        .find((store: { handle: string }) => store.handle === 'neidebeleza');
      expect(neide.products).toHaveLength(6);
      expect(neide.products[0]).toEqual({
        slug: 'perfume-floral-75ml',
        updatedAt: expect.any(String),
      });
    });
  });
});
