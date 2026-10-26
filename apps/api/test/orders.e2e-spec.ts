import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';
import { as, merchantWithStore } from './support/merchant.js';

describe('Merchant orders', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const placeOrder = (handle: string, customerName: string, quantity = 1) =>
    app.inject({
      method: 'POST',
      url: `/storefront/${handle}/orders`,
      payload: {
        customerName,
        fulfillment: 'delivery',
        address: 'Rua das Flores, 10',
        note: 'Sem cobertura',
        items: [{ slug: 'bolo', quantity }],
      },
    });

  const get = (session: string, url: string) =>
    app.inject({ method: 'GET', url, cookies: as(session) });

  it('lists orders newest first with counts, and shows one in detail', async () => {
    const { session, store } = await merchantWithStore(app);
    await placeOrder(store.handle, 'Ana', 2);
    await placeOrder(store.handle, 'Bia');

    const list = await get(session, `/stores/${store.id}/orders`);

    expect(list.statusCode).toBe(200);
    expect(list.json()).toMatchObject({
      orders: [
        { number: 2, customerName: 'Bia', status: 'new', itemCount: 1 },
        {
          number: 1,
          customerName: 'Ana',
          fulfillment: 'delivery',
          totalCents: 6000,
          itemCount: 2,
        },
      ],
      nextBefore: null,
      counts: { new: 2, confirmed: 0, completed: 0, canceled: 0 },
    });

    const [, first] = list.json().orders;
    const detail = await get(session, `/stores/${store.id}/orders/${first.id}`);
    expect(detail.json()).toMatchObject({
      number: 1,
      address: 'Rua das Flores, 10',
      note: 'Sem cobertura',
      items: [{ name: 'Bolo', unitPriceCents: 3000, quantity: 2 }],
    });

    const dashboard = await get(session, `/stores/${store.id}`);
    expect(dashboard.json()).toMatchObject({ orderCount: 2, newOrderCount: 2 });
  });

  it('changes the status and filters by it', async () => {
    const { session, store } = await merchantWithStore(app);
    await placeOrder(store.handle, 'Ana');
    await placeOrder(store.handle, 'Bia');
    const [latest] = (await get(session, `/stores/${store.id}/orders`)).json()
      .orders;

    const updated = await app.inject({
      method: 'PATCH',
      url: `/stores/${store.id}/orders/${latest.id}`,
      cookies: as(session),
      payload: { status: 'confirmed' },
    });
    expect(updated.json()).toMatchObject({ number: 2, status: 'confirmed' });

    const confirmed = await get(
      session,
      `/stores/${store.id}/orders?status=confirmed`,
    );
    expect(
      confirmed.json().orders.map((o: { number: number }) => o.number),
    ).toEqual([2]);
    expect(confirmed.json().counts).toMatchObject({ new: 1, confirmed: 1 });

    const invalid = await app.inject({
      method: 'PATCH',
      url: `/stores/${store.id}/orders/${latest.id}`,
      cookies: as(session),
      payload: { status: 'shipped' },
    });
    expect(invalid.statusCode).toBe(400);
  });

  it('pages through orders', async () => {
    const { session, store } = await merchantWithStore(app);
    for (let i = 0; i < 32; i++) await placeOrder(store.handle, `Cliente ${i}`);

    const first = (await get(session, `/stores/${store.id}/orders`)).json();
    expect(first.orders).toHaveLength(30);
    expect(first.nextBefore).toBe(3);

    const second = (
      await get(
        session,
        `/stores/${store.id}/orders?before=${first.nextBefore}`,
      )
    ).json();
    expect(second.orders.map((o: { number: number }) => o.number)).toEqual([
      2, 1,
    ]);
    expect(second.nextBefore).toBeNull();
  });

  it("keeps other merchants' orders out of reach", async () => {
    const { session, store } = await merchantWithStore(app);
    const other = await merchantWithStore(app);
    await placeOrder(store.handle, 'Ana');
    const [order] = (await get(session, `/stores/${store.id}/orders`)).json()
      .orders;

    expect(
      (await get(other.session, `/stores/${store.id}/orders`)).statusCode,
    ).toBe(404);
    expect(
      (await get(other.session, `/stores/${other.store.id}/orders/${order.id}`))
        .statusCode,
    ).toBe(404);
  });
});
