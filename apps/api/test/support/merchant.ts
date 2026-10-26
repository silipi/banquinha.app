import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import sharp from 'sharp';
import { SESSION_COOKIE } from '../../src/auth/session-cookie.js';

// The test database persists between runs, so names are unique per call.
export const unique = () => randomUUID().slice(0, 8);

export const as = (session: string) => ({ [SESSION_COOKIE]: session });

/** Signs up a merchant with a one-product store; returns the session and the store. */
export async function merchantWithStore(app: NestFastifyApplication) {
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
  const session = signup.cookies.find((c) => c.name === SESSION_COOKIE)!.value;
  const store = await app.inject({
    method: 'POST',
    url: '/stores',
    cookies: as(session),
    payload: {
      handle: `loja-${unique()}`,
      name: 'Loja da Maria',
      whatsapp: '41999991234',
      products: [{ name: 'Bolo', priceCents: 3000 }],
    },
  });
  return { session, store: store.json<{ id: string; handle: string }>() };
}

/** A solid-color JPEG. */
export const photo = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#ff5a1f' } })
    .jpeg()
    .toBuffer();

/** A multipart body with `file`, the way a browser's FormData sends it. */
export async function multipart(file: Buffer, type = 'image/jpeg') {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file)], { type }), 'foto');
  const request = new Request('http://localhost', {
    method: 'POST',
    body: form,
  });
  return {
    headers: { 'content-type': request.headers.get('content-type')! },
    payload: Buffer.from(await request.arrayBuffer()),
  };
}

/** Fetches an uploaded image the way the web app's /api proxy would. */
export const fetchUpload = (app: NestFastifyApplication, url: string) =>
  app.inject({ method: 'GET', url: url.replace(/^\/api/, '') });
