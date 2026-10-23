import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';
import { SESSION_COOKIE } from '../src/auth/session-cookie.js';
import { PLANS } from '../src/plans/plans.js';

interface Theme {
  id: string;
  slug: string;
  tokens: { colors: Record<string, string> };
}

describe('Store onboarding and dashboard', () => {
  let app: NestFastifyApplication;
  let themes: Theme[];
  const themeBySlug = (slug: string) => themes.find((t) => t.slug === slug)!;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    themes = (await app.inject({ method: 'GET', url: '/themes' })).json();
  });

  afterAll(() => app.close());

  // The test database persists between runs, so names are unique per test.
  const unique = () => randomUUID().slice(0, 8);

  /** Signs up a new merchant and returns their session cookie. */
  async function newMerchant(): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        name: 'Maria',
        email: `lojista+${unique()}@exemplo.com`,
        whatsapp: '(41) 99999-1234',
        password: 'senha-boa-123',
      },
    });
    return res.cookies.find((c) => c.name === SESSION_COOKIE)!.value;
  }

  const as = (session: string) => ({ [SESSION_COOKIE]: session });

  const storeInput = (overrides: Record<string, unknown> = {}) => ({
    handle: `Flores ${unique()}`,
    name: 'Flores da Maria',
    whatsapp: '41999991234',
    themeId: themeBySlug('jardim').id,
    products: [{ name: 'Buquê de girassol', priceCents: 8990 }],
    ...overrides,
  });

  const createStore = (session: string, input = storeInput()) =>
    app.inject({
      method: 'POST',
      url: '/stores',
      cookies: as(session),
      payload: input,
    });

  const me = (session: string) =>
    app.inject({ method: 'GET', url: '/me', cookies: as(session) });

  it('lists the platform themes with their tokens', () => {
    expect(themes.map((t) => t.slug)).toEqual([
      'classico',
      'jardim',
      'docinho',
    ]);
    expect(themeBySlug('jardim')).toMatchObject({
      requiredPlan: 'free',
      tokens: { version: 1, colors: { accent: '#4f7a3a' }, radius: 'large' },
    });
  });

  it('uses the first platform theme when none is chosen', async () => {
    const session = await newMerchant();
    const { id } = (
      await createStore(session, storeInput({ themeId: undefined }))
    ).json();
    const dashboard = await app.inject({
      method: 'GET',
      url: `/stores/${id}`,
      cookies: as(session),
    });
    expect(dashboard.json()).toMatchObject({
      themeId: themeBySlug('classico').id,
      theme: themeBySlug('classico').tokens,
    });
  });

  it('refuses a theme that does not exist', async () => {
    const res = await createStore(
      await newMerchant(),
      storeInput({ themeId: randomUUID() }),
    );
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe('Escolha um dos temas');
  });

  it('flags the onboarding as done once the first store is created', async () => {
    const session = await newMerchant();
    const before = (await me(session)).json();
    expect(before).toMatchObject({
      onboardingCompleted: false,
      stores: [],
      plan: { id: 'free', maxStores: 1, maxProducts: PLANS.free.maxProducts },
    });

    const input = storeInput({
      products: [
        { name: 'Bolo de pote', priceCents: 1200, description: 'Chocolate' },
        { name: 'Bolo de pote', priceCents: 1400 },
      ],
    });
    const created = await createStore(session, input);
    expect(created.statusCode).toBe(201);
    const store = created.json();
    expect(store.handle).toMatch(/^flores-[a-z0-9]+$/);

    const after = (await me(session)).json();
    expect(after.onboardingCompleted).toBe(true);
    expect(after.stores).toEqual([store]);

    // Live on the storefront right away, with the theme and unique slugs.
    const storefront = await app.inject({
      method: 'GET',
      url: `/storefront/${store.handle}`,
    });
    expect(storefront.json()).toMatchObject({
      name: 'Flores da Maria',
      theme: themeBySlug('jardim').tokens,
      contact: { whatsapp: '5541999991234' },
      products: [{ slug: 'bolo-de-pote' }, { slug: 'bolo-de-pote-2' }],
    });
  });

  it('requires at least one product', async () => {
    const res = await createStore(
      await newMerchant(),
      storeInput({ products: [] }),
    );
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Cadastre pelo menos um produto');
  });

  it('enforces the plan limits', async () => {
    const session = await newMerchant();
    const tooMany = Array.from(
      { length: PLANS.free.maxProducts + 1 },
      (_, i) => ({ name: `Produto ${i + 1}`, priceCents: 1000 }),
    );
    const products = await createStore(
      session,
      storeInput({ products: tooMany }),
    );
    expect(products.statusCode).toBe(400);
    expect(products.json().message).toContain('até 10 produtos');

    expect((await createStore(session)).statusCode).toBe(201);
    const second = await createStore(session);
    expect(second.statusCode).toBe(403);
    expect(second.json().message).toContain('permite 1 loja');
  });

  it('refuses a taken address and suggests free ones', async () => {
    const handle = `doces-${unique()}`;
    await createStore(await newMerchant(), storeInput({ handle }));

    const check = await app.inject({
      method: 'GET',
      url: `/stores/handle-availability?handle=${handle}`,
    });
    expect(check.json()).toMatchObject({
      available: false,
      message: 'Esse endereço já está em uso',
      suggestions: [`${handle}-loja`, `loja-${handle}`, `${handle}-oficial`],
    });

    const res = await createStore(await newMerchant(), storeInput({ handle }));
    expect(res.statusCode).toBe(409);
  });

  it('shows what is left to customize and saves the description', async () => {
    const session = await newMerchant();
    const { id } = (await createStore(session)).json();

    const dashboard = await app.inject({
      method: 'GET',
      url: `/stores/${id}`,
      cookies: as(session),
    });
    expect(dashboard.json()).toMatchObject({
      productCount: 1,
      maxProducts: PLANS.free.maxProducts,
      setup: [
        { id: 'logo', done: false },
        { id: 'banner', done: false },
        { id: 'description', done: false },
      ],
    });

    const updated = await app.inject({
      method: 'PATCH',
      url: `/stores/${id}`,
      cookies: as(session),
      payload: { bio: '  Flores frescas toda semana.  ' },
    });
    expect(updated.json()).toMatchObject({
      bio: 'Flores frescas toda semana.',
      setup: expect.arrayContaining([{ id: 'description', done: true }]),
    });
  });

  it("hides other merchants' stores", async () => {
    const { id } = (await createStore(await newMerchant())).json();
    const res = await app.inject({
      method: 'GET',
      url: `/stores/${id}`,
      cookies: as(await newMerchant()),
    });
    expect(res.statusCode).toBe(404);
  });

  it('needs a session to create a store', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/stores',
      payload: storeInput(),
    });
    expect(res.statusCode).toBe(401);
  });
});
