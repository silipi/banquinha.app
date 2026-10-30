import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN_SESSION_COOKIE } from '../src/admin/admin-session-cookie.js';
import {
  ADMIN_SETTINGS,
  type AdminSettings,
} from '../src/admin/admin-settings.js';
import { totpCode, totpStep } from '../src/admin/totp.js';
import { createApp } from '../src/app.js';
import { TEST_ADMIN } from './support/admin.js';
import { as, merchantWithStore, unique } from './support/merchant.js';

// One file for everything admin: sign-in failures and spent codes are shared state (the
// audit log), so these tests must not run in parallel with each other. Only Date is faked:
// each fresh code moves the clock to an unused 30-second step.
describe('Admin', () => {
  let app: NestFastifyApplication;
  let settings: AdminSettings;
  let clock = Date.now();
  let session: string;

  /** A code nobody used yet: the clock jumps past the steps of earlier codes. */
  const freshCode = () => {
    clock += 3 * 30_000;
    vi.setSystemTime(clock);
    return totpCode(TEST_ADMIN.totpSecret, totpStep(clock));
  };

  const login = (overrides: Partial<Record<string, string>> = {}) =>
    app.inject({
      method: 'POST',
      url: '/admin/auth/login',
      payload: {
        username: TEST_ADMIN.username,
        password: TEST_ADMIN.password,
        ...overrides,
        code: overrides.code ?? freshCode(),
      },
    });

  const sessionOf = (res: { cookies: { name: string; value: string }[] }) =>
    res.cookies.find((c) => c.name === ADMIN_SESSION_COOKIE)?.value;

  const asAdmin = (token = session) => ({ [ADMIN_SESSION_COOKIE]: token });

  const admin = (
    method: 'GET' | 'PUT' | 'POST' | 'DELETE',
    url: string,
    payload?: object,
  ) => app.inject({ method, url, payload, cookies: asAdmin() });

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    settings = app.get<AdminSettings>(ADMIN_SETTINGS);
    session = sessionOf(await login())!;
  });

  afterAll(async () => {
    await app.close();
    vi.useRealTimers();
  });

  describe('sign-in', () => {
    it('signs in with username, password and code, in a strict cookie', async () => {
      const res = await login();
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ environment: 'development' });
      expect(res.cookies[0]).toMatchObject({
        name: ADMIN_SESSION_COOKIE,
        httpOnly: true,
        sameSite: 'Strict',
        path: '/api/admin',
      });

      const token = sessionOf(res)!;
      const me = await app.inject({
        method: 'GET',
        url: '/admin/auth/me',
        cookies: asAdmin(token),
      });
      expect(me.statusCode).toBe(200);

      const logout = await app.inject({
        method: 'POST',
        url: '/admin/auth/logout',
        cookies: asAdmin(token),
      });
      expect(logout.statusCode).toBe(204);
      const after = await app.inject({
        method: 'GET',
        url: '/admin/auth/me',
        cookies: asAdmin(token),
      });
      expect(after.statusCode).toBe(401);
    });

    it('refuses a wrong username, password or code with the same answer', async () => {
      const answers = await Promise.all([
        login({ username: 'someone-else-entirely' }),
        login({ password: 'wrong-password-123' }),
        login({ code: '000000' }),
      ]);
      for (const res of answers) {
        expect(res.statusCode).toBe(401);
        expect(res.json().message).toBe('Usuário, senha ou código incorretos.');
        expect(sessionOf(res)).toBeUndefined();
      }
    });

    it('accepts each code only once', async () => {
      const code = freshCode();
      expect((await login({ code })).statusCode).toBe(200);
      vi.setSystemTime(clock + 1000);
      expect((await login({ code })).statusCode).toBe(401);
    });

    it('locks sign-in after 5 failures in 15 minutes', async () => {
      // Past the window of the failures recorded by earlier tests.
      clock += 16 * 60_000;
      for (let i = 0; i < 5; i++) {
        await login({ password: 'wrong-password-123' });
      }
      const locked = await login();
      expect(locked.statusCode).toBe(429);
      expect(locked.json().message).toContain('Muitas tentativas');

      clock += 16 * 60_000;
      const later = await login();
      expect(later.statusCode).toBe(200);
      session = sessionOf(later)!;
    });

    it('ends sessions after an hour without requests', async () => {
      const token = sessionOf(await login())!;
      clock += 61 * 60_000;
      vi.setSystemTime(clock);
      const me = await app.inject({
        method: 'GET',
        url: '/admin/auth/me',
        cookies: asAdmin(token),
      });
      expect(me.statusCode).toBe(401);
      session = sessionOf(await login())!;
    });

    it('keeps merchants out of admin routes, and admins out of merchant routes', async () => {
      const { session: merchant } = await merchantWithStore(app);
      const asMerchant = await app.inject({
        method: 'GET',
        url: '/admin/overview',
        cookies: as(merchant),
      });
      expect(asMerchant.statusCode).toBe(401);
      expect(
        (await app.inject({ method: 'GET', url: '/admin/stores' })).statusCode,
      ).toBe(401);

      const me = await app.inject({
        method: 'GET',
        url: '/me',
        cookies: asAdmin(),
      });
      expect(me.statusCode).toBe(401);
    });

    it('answers 404 on every admin route when the admin is not configured', async () => {
      const { credentials } = settings;
      settings.credentials = null;
      try {
        expect((await login()).statusCode).toBe(404);
        expect((await admin('GET', '/admin/overview')).statusCode).toBe(404);
      } finally {
        settings.credentials = credentials;
      }
    });
  });

  it('shows the dashboard numbers', async () => {
    await merchantWithStore(app);
    const res = await admin('GET', '/admin/overview');
    expect(res.statusCode).toBe(200);
    const overview = res.json();
    expect(overview.totals.accounts).toBeGreaterThan(0);
    expect(overview.totals.stores).toBeGreaterThan(0);
    expect(overview.weeks).toHaveLength(12);
    expect(overview.weeks.at(-1).signups).toBeGreaterThan(0);
    expect(overview.funnel[0]).toMatchObject({ key: 'signedUp' });
    expect(overview.plans).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'free' })]),
    );
    expect(
      overview.productsPerStore.map((b: { key: string }) => b.key),
    ).toEqual(['0', '1', '2–5', '6–10', '11–50', '51+']);
  });

  describe('stores', () => {
    it('lists, searches and opens a store', async () => {
      const { store } = await merchantWithStore(app);
      const list = await admin('GET', `/admin/stores?q=${store.handle}`);
      expect(list.json()).toMatchObject({
        total: 1,
        stores: [{ id: store.id, productCount: 1, plan: 'free' }],
      });

      const examples = await admin('GET', '/admin/stores?filter=examples');
      expect(examples.json().stores.length).toBeGreaterThan(0);
      expect(
        examples.json().stores.every((s: { owner: unknown }) => !s.owner),
      ).toBe(true);

      const detail = await admin('GET', `/admin/stores/${store.id}`);
      expect(detail.statusCode).toBe(200);
      expect(detail.json()).toMatchObject({
        handle: store.handle,
        products: [{ name: 'Bolo' }],
        planDetails: { effective: 'free', override: null },
      });
    });

    it('suspends a store: storefront and orders go offline, the merchant sees it', async () => {
      const { session: merchant, store } = await merchantWithStore(app);
      const suspended = await admin(
        'PUT',
        `/admin/stores/${store.id}/suspension`,
        { reason: 'Golpe denunciado' },
      );
      expect(suspended.statusCode).toBe(200);
      expect(suspended.json()).toMatchObject({
        suspensionReason: 'Golpe denunciado',
        audit: [{ action: 'store_suspended' }],
      });

      const storefront = await app.inject({
        method: 'GET',
        url: `/storefront/${store.handle}`,
      });
      expect(storefront.statusCode).toBe(404);
      const order = await app.inject({
        method: 'POST',
        url: `/storefront/${store.handle}/orders`,
        payload: {
          customerName: 'Ana',
          customerWhatsapp: '41988887777',
          fulfillment: 'pickup',
          items: [{ slug: 'bolo', quantity: 1 }],
        },
      });
      expect(order.statusCode).toBe(404);
      const sitemap = await app.inject({
        method: 'GET',
        url: '/sitemap/storefronts',
      });
      expect(JSON.stringify(sitemap.json())).not.toContain(store.handle);
      const dashboard = await app.inject({
        method: 'GET',
        url: `/stores/${store.id}`,
        cookies: as(merchant),
      });
      expect(dashboard.json()).toMatchObject({ suspended: true });

      await admin('DELETE', `/admin/stores/${store.id}/suspension`);
      const back = await app.inject({
        method: 'GET',
        url: `/storefront/${store.handle}`,
      });
      expect(back.statusCode).toBe(200);
    });

    it('deletes a store only when the handle is typed again', async () => {
      const { store } = await merchantWithStore(app);
      const wrong = await admin('POST', `/admin/stores/${store.id}/deletion`, {
        handle: 'outra-loja',
      });
      expect(wrong.statusCode).toBe(400);

      const res = await admin('POST', `/admin/stores/${store.id}/deletion`, {
        handle: store.handle.toUpperCase(),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        handle: store.handle,
        productCount: 1,
        orderCount: 0,
        photoCount: 0,
      });
      expect((await admin('GET', `/admin/stores/${store.id}`)).statusCode).toBe(
        404,
      );

      const log = await admin('GET', '/admin/audit-log');
      expect(log.json().entries[0]).toMatchObject({
        action: 'store_deleted',
        targetId: store.id,
        details: { handle: store.handle },
      });
    });

    it('needs a fresh authenticator code to delete in production', async () => {
      settings.environment = 'production';
      try {
        const { store } = await merchantWithStore(app);
        const url = `/admin/stores/${store.id}/deletion`;
        const noCode = await admin('POST', url, { handle: store.handle });
        expect(noCode.statusCode).toBe(403);

        const code = freshCode();
        const res = await admin('POST', url, { handle: store.handle, code });
        expect(res.statusCode).toBe(200);

        // The code is spent: it cannot sign in either.
        expect((await login({ code })).statusCode).toBe(401);
      } finally {
        settings.environment = 'development';
      }
    });
  });

  describe('plan overrides', () => {
    it('gives a plan for free and raises the limits right away', async () => {
      const { session: merchant, store } = await merchantWithStore(app);
      const ownerId = (await admin('GET', `/admin/stores/${store.id}`)).json()
        .owner.id;

      const res = await admin(
        'PUT',
        `/admin/accounts/${ownerId}/plan-override`,
        {
          plan: 'pro',
          reason: 'Amiga do Gabriel',
        },
      );
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        plan: {
          effective: 'pro',
          paid: 'free',
          override: 'pro',
          overrideActive: true,
          overrideReason: 'Amiga do Gabriel',
        },
        audit: [{ action: 'plan_override_set' }],
      });

      const me = await app.inject({
        method: 'GET',
        url: '/me',
        cookies: as(merchant),
      });
      expect(me.json().plan).toMatchObject({ id: 'pro', maxProducts: 200 });

      const comped = await admin('GET', '/admin/accounts?comped=true');
      expect(comped.json().accounts.map((a: { id: string }) => a.id)).toContain(
        ownerId,
      );

      const removed = await admin(
        'DELETE',
        `/admin/accounts/${ownerId}/plan-override`,
      );
      expect(removed.json().plan).toMatchObject({
        effective: 'free',
        override: null,
      });
      const after = await app.inject({
        method: 'GET',
        url: '/me',
        cookies: as(merchant),
      });
      expect(after.json().plan.id).toBe('free');
    });

    it('ends the override on its expiry date', async () => {
      const { session: merchant, store } = await merchantWithStore(app);
      const ownerId = (await admin('GET', `/admin/stores/${store.id}`)).json()
        .owner.id;
      const expiresAt = new Date(clock + 24 * 60 * 60 * 1000).toISOString();
      await admin('PUT', `/admin/accounts/${ownerId}/plan-override`, {
        plan: 'pro',
        expiresAt,
        reason: 'Teste de um dia',
      });
      const me = () =>
        app.inject({ method: 'GET', url: '/me', cookies: as(merchant) });
      expect((await me()).json().plan.id).toBe('pro');

      vi.setSystemTime(clock + 25 * 60 * 60 * 1000);
      expect((await me()).json().plan.id).toBe('free');
      vi.setSystemTime(clock);
    });

    it('refuses an expiry in the past and an unknown plan', async () => {
      const { store } = await merchantWithStore(app);
      const ownerId = (await admin('GET', `/admin/stores/${store.id}`)).json()
        .owner.id;
      const url = `/admin/accounts/${ownerId}/plan-override`;
      const past = await admin('PUT', url, {
        plan: 'pro',
        expiresAt: '2020-01-01',
        reason: 'Teste',
      });
      expect(past.statusCode).toBe(400);
      const unknown = await admin('PUT', url, {
        plan: `gold-${unique()}`,
        reason: 'Teste',
      });
      expect(unknown.statusCode).toBe(400);
    });
  });

  describe('accounts', () => {
    const ownerOf = async (storeId: string) =>
      (await admin('GET', `/admin/stores/${storeId}`)).json<{
        owner: { id: string; email: string };
      }>().owner;

    it('deletes an account with its stores only when the email is typed again', async () => {
      const { session: merchant, store } = await merchantWithStore(app);
      const owner = await ownerOf(store.id);
      const url = `/admin/accounts/${owner.id}/deletion`;
      const wrong = await admin('POST', url, { email: 'outra@exemplo.com' });
      expect(wrong.statusCode).toBe(400);

      const res = await admin('POST', url, {
        email: owner.email.toUpperCase(),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        email: owner.email,
        storeHandles: [store.handle],
        productCount: 1,
        orderCount: 0,
        photoCount: 0,
      });
      expect(
        (await admin('GET', `/admin/accounts/${owner.id}`)).statusCode,
      ).toBe(404);
      expect((await admin('GET', `/admin/stores/${store.id}`)).statusCode).toBe(
        404,
      );
      const storefront = await app.inject({
        method: 'GET',
        url: `/storefront/${store.handle}`,
      });
      expect(storefront.statusCode).toBe(404);
      const me = await app.inject({
        method: 'GET',
        url: '/me',
        cookies: as(merchant),
      });
      expect(me.statusCode).toBe(401);

      const log = await admin('GET', '/admin/audit-log');
      expect(log.json().entries[0]).toMatchObject({
        action: 'account_deleted',
        targetId: owner.id,
        details: { email: owner.email, storeIds: [store.id] },
      });
    });

    it('needs a fresh authenticator code to delete in production', async () => {
      settings.environment = 'production';
      try {
        const { store } = await merchantWithStore(app);
        const owner = await ownerOf(store.id);
        const url = `/admin/accounts/${owner.id}/deletion`;
        const noCode = await admin('POST', url, { email: owner.email });
        expect(noCode.statusCode).toBe(403);
        expect(
          (await admin('GET', `/admin/stores/${store.id}`)).statusCode,
        ).toBe(200);

        const res = await admin('POST', url, {
          email: owner.email,
          code: freshCode(),
        });
        expect(res.statusCode).toBe(200);
      } finally {
        settings.environment = 'development';
      }
    });
  });
});
