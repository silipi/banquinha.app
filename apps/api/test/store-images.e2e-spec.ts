import { randomBytes, randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import sharp from 'sharp';
import { createApp } from '../src/app.js';
import { SESSION_COOKIE } from '../src/auth/session-cookie.js';

describe('Store logo and banner uploads', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const unique = () => randomUUID().slice(0, 8);
  const as = (session: string) => ({ [SESSION_COOKIE]: session });

  /** Signs up a merchant with a store; returns the session and the store. */
  async function merchantWithStore() {
    const signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        name: 'Maria',
        email: `lojista+${unique()}@exemplo.com`,
        whatsapp: '(41) 99999-1234',
        password: 'senha-boa-123',
      },
    });
    const session = signup.cookies.find(
      (c) => c.name === SESSION_COOKIE,
    )!.value;
    const store = await app.inject({
      method: 'POST',
      url: '/stores',
      cookies: as(session),
      payload: {
        handle: `fotos-${unique()}`,
        name: 'Fotos da Maria',
        whatsapp: '41999991234',
        products: [{ name: 'Bolo', priceCents: 3000 }],
      },
    });
    return {
      session,
      store: store.json<{ id: string; handle: string }>(),
    };
  }

  const photo = (width: number, height: number) =>
    sharp({
      create: { width, height, channels: 3, background: '#ff5a1f' },
    })
      .jpeg()
      .toBuffer();

  /** Builds a multipart body the way a browser's FormData would. */
  async function multipart(file: Buffer, type: string, field = 'file') {
    const form = new FormData();
    form.append(field, new Blob([new Uint8Array(file)], { type }), 'foto');
    const request = new Request('http://localhost', {
      method: 'POST',
      body: form,
    });
    return {
      headers: { 'content-type': request.headers.get('content-type')! },
      payload: Buffer.from(await request.arrayBuffer()),
    };
  }

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

  /** Fetches an uploaded image the way the web app's /api proxy would. */
  const fetchUpload = (url: string) =>
    app.inject({ method: 'GET', url: url.replace(/^\/api/, '') });

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
