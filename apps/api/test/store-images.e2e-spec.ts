import { randomBytes } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import {
  as,
  fetchUpload as fetchUploadFrom,
  merchantWithStore as newMerchantWithStore,
  multipart,
  photo,
} from './support/merchant.js';

describe('Store logo and banner uploads', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const merchantWithStore = () => newMerchantWithStore(app);
  const fetchUpload = (url: string) => fetchUploadFrom(app, url);

  async function upload(
    session: string | null,
    storeId: string,
    slot: string,
    file: Buffer,
    type = 'image/jpeg',
  ) {
    return app.inject({
      method: 'PUT',
      url: `/stores/${storeId}/images/${slot}`,
      cookies: session ? as(session) : {},
      ...(await multipart(file, type)),
    });
  }

  it('stores the logo as a 512px square webp and marks the step done', async () => {
    const { session, store } = await merchantWithStore();

    const res = await upload(session, store.id, 'logo', await photo(1200, 800));

    expect(res.statusCode).toBe(200);
    const dashboard = res.json();
    expect(dashboard.logoUrl).toMatch(
      new RegExp(`^/api/uploads/stores/${store.id}/logo-[0-9a-f-]+\\.webp$`),
    );
    expect(dashboard.setup).toContainEqual({ id: 'logo', done: true });

    const image = await fetchUpload(dashboard.logoUrl);
    expect(image.statusCode).toBe(200);
    expect(image.headers['content-type']).toBe('image/webp');
    expect(image.headers['cache-control']).toContain('immutable');
    expect(await sharp(image.rawPayload).metadata()).toMatchObject({
      format: 'webp',
      width: 512,
      height: 512,
    });

    const storefront = await app.inject({
      method: 'GET',
      url: `/storefront/${store.handle}`,
    });
    expect(storefront.json()).toMatchObject({ logoUrl: dashboard.logoUrl });
  });

  it('shrinks a wide banner keeping its proportions', async () => {
    const { session, store } = await merchantWithStore();

    const res = await upload(
      session,
      store.id,
      'banner',
      await photo(4096, 1024),
    );

    const { bannerUrl, setup } = res.json();
    expect(setup).toContainEqual({ id: 'banner', done: true });
    const image = await fetchUpload(bannerUrl);
    expect(await sharp(image.rawPayload).metadata()).toMatchObject({
      width: 2048,
      height: 512,
    });
  });

  it('deletes the previous file when replacing or removing an image', async () => {
    const { session, store } = await merchantWithStore();
    const first = (
      await upload(session, store.id, 'logo', await photo(300, 300))
    ).json().logoUrl;
    const second = (
      await upload(session, store.id, 'logo', await photo(300, 300))
    ).json().logoUrl;

    expect(second).not.toBe(first);
    expect((await fetchUpload(first)).statusCode).toBe(404);
    expect((await fetchUpload(second)).statusCode).toBe(200);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/stores/${store.id}/images/logo`,
      cookies: as(session),
    });
    expect(removed.json()).toMatchObject({ logoUrl: null });
    expect(removed.json().setup).toContainEqual({ id: 'logo', done: false });
    expect((await fetchUpload(second)).statusCode).toBe(404);
  });

  it('refuses files that are not images', async () => {
    const { session, store } = await merchantWithStore();

    const res = await upload(
      session,
      store.id,
      'logo',
      Buffer.from('não sou uma imagem'),
      'image/png',
    );

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toMatch(/Não conseguimos abrir essa imagem/);
  });

  it('refuses files over 10 MB', async () => {
    const { session, store } = await merchantWithStore();

    const res = await upload(
      session,
      store.id,
      'banner',
      randomBytes(10 * 1024 * 1024 + 1),
    );

    expect(res.statusCode).toBe(413);
    expect(res.json().message).toMatch(/até 10 MB/);
  });

  it('refuses unknown slots, other merchants and signed-out uploads', async () => {
    const { session, store } = await merchantWithStore();
    const other = await merchantWithStore();
    const file = await photo(100, 100);

    expect((await upload(session, store.id, 'avatar', file)).statusCode).toBe(
      400,
    );
    expect(
      (await upload(other.session, store.id, 'logo', file)).statusCode,
    ).toBe(404);
    expect((await upload(null, store.id, 'logo', file)).statusCode).toBe(401);
  });

  it('serves nothing outside the uploads folder', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/uploads/..%2F..%2Fpackage.json',
    });
    expect(res.statusCode).toBe(404);
  });
});
