import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { PLANS } from '../src/plans/plans.js';
import {
  as,
  fetchUpload,
  merchantWithStore,
  multipart,
  photo,
} from './support/merchant.js';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  active: boolean;
  images: { id: string; url: string }[];
}

describe('Product management', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const send = (
    session: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    url: string,
    payload?: object,
  ) => app.inject({ method, url, cookies: as(session), payload });

  const createProduct = (
    session: string,
    storeId: string,
    payload: Record<string, unknown>,
  ) => send(session, 'POST', `/stores/${storeId}/products`, payload);

  const list = async (session: string, storeId: string) =>
    (await send(session, 'GET', `/stores/${storeId}/products`)).json<{
      products: Product[];
      maxProducts: number;
      maxImagesPerProduct: number;
    }>();

  const storefront = async (handle: string) =>
    (await app.inject({ method: 'GET', url: `/storefront/${handle}` })).json<{
      products: { slug: string; imageUrl: string | null }[];
    }>();

  const addImage = async (
    session: string,
    storeId: string,
    productId: string,
    file?: Buffer,
  ) =>
    app.inject({
      method: 'POST',
      url: `/stores/${storeId}/products/${productId}/images`,
      cookies: as(session),
      ...(await multipart(file ?? (await photo(2400, 1800)))),
    });

  it('creates products at the end of the list with unique slugs', async () => {
    const { session, store } = await merchantWithStore(app);

    const res = await createProduct(session, store.id, {
      name: '  Bolo  ',
      priceCents: 4500,
      description: '  De cenoura  ',
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      slug: 'bolo-2',
      name: 'Bolo',
      description: 'De cenoura',
      priceCents: 4500,
      active: true,
      images: [],
    });
    const { products, maxProducts, maxImagesPerProduct } = await list(
      session,
      store.id,
    );
    expect(products.map((p) => p.slug)).toEqual(['bolo', 'bolo-2']);
    expect(maxProducts).toBe(PLANS.free.maxProducts);
    expect(maxImagesPerProduct).toBe(PLANS.free.maxImagesPerProduct);
  });

  it('edits a product, keeping its slug, and hides it from the storefront', async () => {
    const { session, store } = await merchantWithStore(app);
    const [bolo] = (await list(session, store.id)).products;

    const res = await send(
      session,
      'PATCH',
      `/stores/${store.id}/products/${bolo!.id}`,
      {
        name: 'Bolo de fubá',
        priceCents: 3500,
        description: '',
        active: false,
      },
    );

    expect(res.json()).toMatchObject({
      slug: 'bolo',
      name: 'Bolo de fubá',
      priceCents: 3500,
      description: null,
      active: false,
    });
    expect((await storefront(store.handle)).products).toEqual([]);
    // Still listed for the merchant.
    expect((await list(session, store.id)).products).toHaveLength(1);
  });

  it('validates edits like the onboarding does', async () => {
    const { session, store } = await merchantWithStore(app);
    const [bolo] = (await list(session, store.id)).products;

    const res = await send(
      session,
      'PATCH',
      `/stores/${store.id}/products/${bolo!.id}`,
      { priceCents: 0 },
    );

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Informe o preço');
  });

  it('reorders products and refuses a list that does not match', async () => {
    const { session, store } = await merchantWithStore(app);
    await createProduct(session, store.id, { name: 'Torta', priceCents: 5000 });
    const ids = (await list(session, store.id)).products.map((p) => p.id);

    const res = await send(
      session,
      'PUT',
      `/stores/${store.id}/products/order`,
      {
        productIds: [...ids].reverse(),
      },
    );

    expect(res.json().products.map((p: Product) => p.name)).toEqual([
      'Torta',
      'Bolo',
    ]);
    expect(
      (await storefront(store.handle)).products.map((p) => p.slug),
    ).toEqual(['torta', 'bolo']);
    const missing = await send(
      session,
      'PUT',
      `/stores/${store.id}/products/order`,
      { productIds: [ids[0]] },
    );
    expect(missing.statusCode).toBe(400);
  });

  it("enforces the plan's product limit", async () => {
    const { session, store } = await merchantWithStore(app);
    for (let i = 1; i < PLANS.free.maxProducts; i++) {
      const res = await createProduct(session, store.id, {
        name: `Produto ${i}`,
        priceCents: 1000,
      });
      expect(res.statusCode).toBe(201);
    }

    const res = await createProduct(session, store.id, {
      name: 'Um a mais',
      priceCents: 1000,
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().message).toMatch(/permite até 10 produtos/);
  });

  it('adds photos as webp, sets the cover and enforces the photo limit', async () => {
    const { session, store } = await merchantWithStore(app);
    const [bolo] = (await list(session, store.id)).products;
    const path = `/stores/${store.id}/products/${bolo!.id}`;

    const first = await addImage(session, store.id, bolo!.id);
    expect(first.statusCode).toBe(201);
    const [image] = first.json<Product>().images;
    expect(image!.url).toMatch(
      new RegExp(`^/api/uploads/stores/${store.id}/products/${bolo!.id}-`),
    );
    const stored = await fetchUpload(app, image!.url);
    expect(await sharp(stored.rawPayload).metadata()).toMatchObject({
      format: 'webp',
      width: 1600,
      height: 1200,
    });

    for (let i = 1; i < PLANS.free.maxImagesPerProduct; i++) {
      await addImage(session, store.id, bolo!.id);
    }
    const tooMany = await addImage(session, store.id, bolo!.id);
    expect(tooMany.statusCode).toBe(403);
    expect(tooMany.json().message).toMatch(/fotos por produto/);

    const ids = (await list(session, store.id)).products[0]!.images.map(
      (i) => i.id,
    );
    const reordered = await send(session, 'PUT', `${path}/images/order`, {
      imageIds: [ids[2], ids[0], ids[1]],
    });
    const cover = reordered.json<Product>().images[0]!;
    expect(cover.id).toBe(ids[2]);
    expect((await storefront(store.handle)).products[0]!.imageUrl).toBe(
      cover.url,
    );
  });

  it('removes a photo and its file', async () => {
    const { session, store } = await merchantWithStore(app);
    const [bolo] = (await list(session, store.id)).products;
    const [image] = (
      await addImage(session, store.id, bolo!.id)
    ).json<Product>().images;

    const res = await send(
      session,
      'DELETE',
      `/stores/${store.id}/products/${bolo!.id}/images/${image!.id}`,
    );

    expect(res.json().images).toEqual([]);
    expect((await fetchUpload(app, image!.url)).statusCode).toBe(404);
  });

  it('deletes a product with its photos', async () => {
    const { session, store } = await merchantWithStore(app);
    const [bolo] = (await list(session, store.id)).products;
    const [image] = (
      await addImage(session, store.id, bolo!.id)
    ).json<Product>().images;

    const res = await send(
      session,
      'DELETE',
      `/stores/${store.id}/products/${bolo!.id}`,
    );

    expect(res.statusCode).toBe(204);
    expect((await list(session, store.id)).products).toEqual([]);
    expect((await fetchUpload(app, image!.url)).statusCode).toBe(404);
  });

  it("keeps other merchants' products out of reach", async () => {
    const { session, store } = await merchantWithStore(app);
    const other = await merchantWithStore(app);
    const [bolo] = (await list(session, store.id)).products;

    expect(
      (await send(other.session, 'GET', `/stores/${store.id}/products`))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await send(
          other.session,
          'PATCH',
          `/stores/${store.id}/products/${bolo!.id}`,
          { name: 'Meu agora' },
        )
      ).statusCode,
    ).toBe(404);
    // Their own store id with someone else's product id.
    expect(
      (
        await send(
          other.session,
          'DELETE',
          `/stores/${other.store.id}/products/${bolo!.id}`,
        )
      ).statusCode,
    ).toBe(404);
  });
});
