import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';

describe('GET /stores/handle-availability', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  it('normalizes and accepts a free handle', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/stores/handle-availability?handle=Minha%20Loja',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ handle: 'minha-loja', available: true });
  });

  it('rejects a reserved handle', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/stores/handle-availability?handle=api',
    });
    expect(res.json()).toMatchObject({ available: false });
  });

  it('requires the handle query param', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/stores/handle-availability',
    });
    expect(res.statusCode).toBe(400);
  });
});
