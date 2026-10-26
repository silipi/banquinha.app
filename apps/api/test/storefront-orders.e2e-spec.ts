import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';

describe('POST /storefront/:handle/orders', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const placeOrder = (handle: string, payload: object) =>
    app.inject({
      method: 'POST',
      url: `/storefront/${handle}/orders`,
      payload,
    });

  const validOrder = {
    customerName: '  Marina  ',
    customerWhatsapp: '(41) 99999-0000',
    fulfillment: 'pickup',
    items: [
      { slug: 'samambaia', quantity: 2 },
      { slug: 'jiboia', quantity: 1 },
    ],
  };

  it('prices the order on the server and returns a WhatsApp link', async () => {
    const res = await placeOrder('pauloplantas', validOrder);
    expect(res.statusCode).toBe(201);

    const order = res.json();
    expect(order.totalCents).toBe(2 * 2500 + 2800);
    expect(order.number).toBeGreaterThan(0);

    const url = new URL(order.whatsappUrl);
    expect(url.origin + url.pathname).toBe('https://wa.me/5545999158412');
    const message = url.searchParams.get('text');
    expect(message).toContain(`*Pedido #${order.number}*`);
    expect(message).toContain('2x Samambaia — R$ 50,00');
    expect(message).toContain('Nome: Marina\n');
  });

  it('numbers orders sequentially within the store', async () => {
    const lulucaOrder = {
      customerName: 'Ana',
      customerWhatsapp: '41999990000',
      fulfillment: 'delivery',
      address: 'Rua das Flores, 10',
      items: [{ slug: 'coelhinho-de-pano', quantity: 1 }],
    };
    const first = (await placeOrder('luluca', lulucaOrder)).json();
    const second = (await placeOrder('luluca', lulucaOrder)).json();
    expect(second.number).toBe(first.number + 1);
  });

  it('merges repeated products', async () => {
    const res = await placeOrder('pauloplantas', {
      ...validOrder,
      items: [
        { slug: 'jiboia', quantity: 1 },
        { slug: 'jiboia', quantity: 2 },
      ],
    });
    expect(res.json().totalCents).toBe(3 * 2800);
  });

  it('rejects products that are not in the store', async () => {
    const res = await placeOrder('pauloplantas', {
      ...validOrder,
      items: [
        { slug: 'samambaia', quantity: 1 },
        { slug: 'colar-aurora', quantity: 1 },
      ],
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ unavailableSlugs: ['colar-aurora'] });
  });

  it('requires an address for delivery', async () => {
    const res = await placeOrder('pauloplantas', {
      ...validOrder,
      fulfillment: 'delivery',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Informe o endereço de entrega');
  });

  it("requires the customer's WhatsApp", async () => {
    const { customerWhatsapp: _, ...withoutWhatsapp } = validOrder;
    for (const payload of [
      withoutWhatsapp,
      { ...validOrder, customerWhatsapp: '4133334444' },
    ]) {
      const res = await placeOrder('pauloplantas', payload);
      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain(
        'Confira seu WhatsApp: use o DDD e o número do celular',
      );
    }
  });

  it('rejects an empty cart', async () => {
    const res = await placeOrder('pauloplantas', { ...validOrder, items: [] });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toContain('Sua sacola está vazia');
  });

  it('returns 404 for an unknown store', async () => {
    const res = await placeOrder('nao-existe', validOrder);
    expect(res.statusCode).toBe(404);
  });
});
