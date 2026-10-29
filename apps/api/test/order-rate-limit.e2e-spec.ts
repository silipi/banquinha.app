import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';

const INTERNAL_KEY = 'test-internal-key-0123456789abcdef0123';

describe('Order rate limit', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // Read when the app is created, so set before createApp().
    process.env.ORDER_RATE_LIMIT = '3';
    process.env.INTERNAL_API_KEY = INTERNAL_KEY;
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const order = {
    customerName: 'Ana',
    customerWhatsapp: '41999990000',
    fulfillment: 'pickup',
    items: [{ slug: 'kit-batons', quantity: 1 }],
  };
  const placeOrder = (headers: Record<string, string> = {}) =>
    app.inject({
      method: 'POST',
      url: '/storefront/neidebeleza/orders',
      payload: order,
      headers,
    });

  it('blocks a client after the limit with a pt-BR message', async () => {
    for (let i = 0; i < 3; i++) {
      expect((await placeOrder()).statusCode).toBe(201);
    }
    const blocked = await placeOrder();
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().message).toContain('Muitos pedidos');
  });

  it('tracks the forwarded customer IP when the internal key is valid', async () => {
    const res = await placeOrder({
      'x-internal-key': INTERNAL_KEY,
      'x-client-ip': '203.0.113.10',
    });
    expect(res.statusCode).toBe(201);
  });

  it('ignores the forwarded IP without a valid internal key', async () => {
    const res = await placeOrder({
      'x-internal-key': 'wrong-key-wrong-key-wrong-key-wrong-key',
      'x-client-ip': '203.0.113.11',
    });
    // Falls back to the connection IP, which the first test exhausted.
    expect(res.statusCode).toBe(429);
  });
});
