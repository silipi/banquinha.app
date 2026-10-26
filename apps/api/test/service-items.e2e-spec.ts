import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';
import { as, merchantWithStore, unique } from './support/merchant.js';

describe('Services and price types', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const send = (
    session: string,
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    payload?: object,
  ) => app.inject({ method, url, cookies: as(session), payload });

  const storefront = async (handle: string) =>
    (await app.inject({ method: 'GET', url: `/storefront/${handle}` })).json();

  const placeOrder = (handle: string, payload: object) =>
    app.inject({
      method: 'POST',
      url: `/storefront/${handle}/orders`,
      payload: {
        customerName: 'Ana',
        customerWhatsapp: '41999990000',
        ...payload,
      },
    });

  /** "YYYY-MM-DD", `days` from today in Brazil. */
  const day = (days: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
      new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    );

  /** A store with a fixed product and three services: hourly, from and quote. */
  async function serviceStore() {
    const merchant = await merchantWithStore(app);
    const create = (payload: object) =>
      send(
        merchant.session,
        'POST',
        `/stores/${merchant.store.id}/products`,
        payload,
      );
    for (const payload of [
      {
        name: 'Suporte técnico',
        kind: 'service',
        priceType: 'hourly',
        priceCents: 6000,
      },
      {
        name: 'Limpeza de notebook',
        kind: 'service',
        priceType: 'from',
        priceCents: 9000,
      },
      { name: 'Montagem de PC', kind: 'service', priceType: 'quote' },
    ]) {
      expect((await create(payload)).statusCode).toBe(201);
    }
    return merchant;
  }

  it('creates and edits items with a kind and a price type', async () => {
    const { session, store } = await merchantWithStore(app);
    const url = `/stores/${store.id}/products`;

    const quote = await send(session, 'POST', url, {
      name: 'Orçamento de reforma',
      kind: 'service',
      priceType: 'quote',
      priceCents: 5000,
    });
    expect(quote.statusCode).toBe(201);
    expect(quote.json()).toMatchObject({
      kind: 'service',
      priceType: 'quote',
      priceCents: null,
    });

    // Back to a firm price needs a price again.
    const productUrl = `${url}/${quote.json().id}`;
    const missing = await send(session, 'PATCH', productUrl, {
      priceType: 'daily',
    });
    expect(missing.statusCode).toBe(400);
    expect(missing.json().message).toBe('Informe o preço');

    const daily = await send(session, 'PATCH', productUrl, {
      priceType: 'daily',
      priceCents: 18000,
    });
    expect(daily.json()).toMatchObject({
      priceType: 'daily',
      priceCents: 18000,
    });

    // Per hour or day is for services only.
    const product = await send(session, 'PATCH', productUrl, {
      kind: 'product',
    });
    expect(product.statusCode).toBe(400);
    expect(product.json().message).toContain('só para serviços');

    // Without a kind and a price type, it's a product with a fixed price.
    const plain = await send(session, 'POST', url, {
      name: 'Bolo',
      priceCents: 3000,
    });
    expect(plain.json()).toMatchObject({ kind: 'product', priceType: 'fixed' });
    const noPrice = await send(session, 'POST', url, { name: 'Torta' });
    expect(noPrice.statusCode).toBe(400);
  });

  it('shows pricing and the service area on the storefront', async () => {
    const { session, store } = await serviceStore();
    await send(session, 'PATCH', `/stores/${store.id}`, {
      serviceArea: '  Curitiba e região  ',
      onlineEnabled: true,
    });

    const page = await storefront(store.handle);
    expect(page.serviceArea).toBe('Curitiba e região');
    expect(page.fulfillment).toEqual(['pickup', 'delivery', 'online']);
    expect(page.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Suporte técnico',
          kind: 'service',
          priceType: 'hourly',
          priceCents: 6000,
        }),
        expect.objectContaining({
          name: 'Montagem de PC',
          priceType: 'quote',
          priceCents: null,
        }),
      ]),
    );
  });

  it('totals firm prices only and records the preferred time', async () => {
    const { session, store } = await serviceStore();
    const res = await placeOrder(store.handle, {
      fulfillment: 'delivery',
      address: 'Rua das Flores, 10',
      preferredDate: day(3),
      preferredPeriod: 'morning',
      items: [
        { slug: 'suporte-tecnico', quantity: 2 },
        { slug: 'limpeza-de-notebook', quantity: 1 },
        { slug: 'montagem-de-pc', quantity: 1 },
        { slug: 'bolo', quantity: 1 },
      ],
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      totalCents: 2 * 6000 + 3000,
      priceToConfirm: true,
    });
    const message = new URL(res.json().whatsappUrl).searchParams.get('text');
    expect(message).toContain('2 horas · Suporte técnico — R$ 120,00');
    expect(message).toContain('1x Montagem de PC — sob orçamento');
    expect(message).toContain(
      'Atendimento no meu endereço: Rua das Flores, 10',
    );
    expect(message).toContain('Data preferida:');

    const [summary] = (
      await send(session, 'GET', `/stores/${store.id}/orders`)
    ).json().orders;
    expect(summary).toMatchObject({ priceToConfirm: true, hasServices: true });

    const detail = (
      await send(session, 'GET', `/stores/${store.id}/orders/${summary.id}`)
    ).json();
    expect(detail).toMatchObject({
      preferredDate: day(3),
      preferredPeriod: 'morning',
    });
    expect(detail.items).toContainEqual(
      expect.objectContaining({
        name: 'Montagem de PC',
        kind: 'service',
        priceType: 'quote',
        unitPriceCents: null,
      }),
    );
    expect(
      new URL(detail.customerLinks.ready).searchParams.get('text'),
    ).toContain('Estou a caminho para o atendimento do pedido');
  });

  it('keeps online for services and checks the preferred date', async () => {
    const { session, store } = await serviceStore();

    const offline = await placeOrder(store.handle, {
      fulfillment: 'online',
      items: [{ slug: 'suporte-tecnico', quantity: 1 }],
    });
    expect(offline.statusCode).toBe(400);
    expect(offline.json().message).toContain('não atende online');

    await send(session, 'PATCH', `/stores/${store.id}`, {
      onlineEnabled: true,
    });
    const withProduct = await placeOrder(store.handle, {
      fulfillment: 'online',
      items: [
        { slug: 'suporte-tecnico', quantity: 1 },
        { slug: 'bolo', quantity: 1 },
      ],
    });
    expect(withProduct.statusCode).toBe(400);
    expect(withProduct.json().message).toContain('só para serviços');

    const past = await placeOrder(store.handle, {
      fulfillment: 'online',
      preferredDate: day(-2),
      items: [{ slug: 'suporte-tecnico', quantity: 1 }],
    });
    expect(past.statusCode).toBe(400);
    expect(past.json().message).toContain('de hoje em diante');

    const online = await placeOrder(store.handle, {
      fulfillment: 'online',
      preferredDate: day(0),
      items: [{ slug: 'suporte-tecnico', quantity: 1 }],
    });
    expect(online.statusCode).toBe(201);

    // Without services, the preferred time is ignored.
    const products = await placeOrder(store.handle, {
      fulfillment: 'pickup',
      preferredDate: day(-2),
      items: [{ slug: 'bolo', quantity: 1 }],
    });
    expect(products.statusCode).toBe(201);
  });

  it('keeps at least one way to receive orders', async () => {
    const { session, store } = await merchantWithStore(app);
    const res = await send(session, 'PATCH', `/stores/${store.id}`, {
      pickupEnabled: false,
      deliveryEnabled: false,
    });
    expect(res.statusCode).toBe(400);

    const onlineOnly = await send(session, 'PATCH', `/stores/${store.id}`, {
      pickupEnabled: false,
      deliveryEnabled: false,
      onlineEnabled: true,
    });
    expect(onlineOnly.json()).toMatchObject({
      pickupEnabled: false,
      deliveryEnabled: false,
      onlineEnabled: true,
    });
  });

  it('creates a service store in the onboarding', async () => {
    const signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        name: 'Rafa',
        email: `tecnico+${unique()}@exemplo.com`,
        whatsapp: '41999991234',
        password: 'senha-boa-123',
      },
    });
    const session = signup.cookies.find(
      (c) => c.name === 'banquinha_session',
    )?.value;
    expect(session).toBeDefined();

    const res = await send(session!, 'POST', '/stores', {
      handle: `tecnico-${unique()}`,
      name: 'Tech do Rafa',
      whatsapp: '41999991234',
      pickupEnabled: false,
      deliveryEnabled: true,
      products: [
        {
          name: 'Formatação',
          kind: 'service',
          priceType: 'fixed',
          priceCents: 12000,
        },
        { name: 'Montagem de PC', kind: 'service', priceType: 'quote' },
      ],
    });
    expect(res.statusCode).toBe(201);

    const page = await storefront(res.json().handle);
    expect(page.fulfillment).toEqual(['delivery']);
    expect(
      page.products.map((p: { priceType: string }) => p.priceType),
    ).toEqual(['fixed', 'quote']);
  });
});
