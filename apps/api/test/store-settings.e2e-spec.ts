import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';
import { as, merchantWithStore } from './support/merchant.js';

describe('Store settings', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const patch = (session: string, storeId: string, payload: object) =>
    app.inject({
      method: 'PATCH',
      url: `/stores/${storeId}`,
      cookies: as(session),
      payload,
    });

  const storefront = async (handle: string) =>
    (await app.inject({ method: 'GET', url: `/storefront/${handle}` })).json();

  it('saves contacts and details, normalizing what people paste', async () => {
    const { session, store } = await merchantWithStore(app);

    const res = await patch(session, store.id, {
      name: '  Flores da Maria  ',
      city: ' Curitiba ',
      whatsapp: '(41) 98888-7777',
      instagram: 'https://www.instagram.com/Flores.DaMaria/?hl=pt',
      locationUrl: 'https://maps.app.goo.gl/abc123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      name: 'Flores da Maria',
      city: 'Curitiba',
      whatsapp: '5541988887777',
      instagram: 'flores.damaria',
      locationUrl: 'https://maps.app.goo.gl/abc123',
    });
    expect(await storefront(store.handle)).toMatchObject({
      name: 'Flores da Maria',
      city: 'Curitiba',
      contact: {
        whatsapp: '5541988887777',
        instagram: 'flores.damaria',
        locationUrl: 'https://maps.app.goo.gl/abc123',
      },
    });

    const cleared = await patch(session, store.id, {
      city: '',
      instagram: '',
      locationUrl: '',
    });
    expect(cleared.json()).toMatchObject({
      city: null,
      instagram: null,
      locationUrl: null,
    });
  });

  it('rejects invalid contacts with messages in Portuguese', async () => {
    const { session, store } = await merchantWithStore(app);

    for (const [payload, message] of [
      [{ whatsapp: '1234' }, /Confira o WhatsApp/],
      [{ instagram: 'flores da maria' }, /Confira o Instagram/],
      [{ locationUrl: 'maps.google.com/x' }, /link completo/],
      [{ name: 'A' }, /Dê um nome/],
    ] as const) {
      const res = await patch(session, store.id, payload);
      expect(res.statusCode).toBe(400);
      expect(JSON.stringify(res.json().message)).toMatch(message);
    }
  });

  it('offers only the chosen ways to receive and keeps at least one', async () => {
    const { session, store } = await merchantWithStore(app);
    expect((await storefront(store.handle)).fulfillment).toEqual([
      'pickup',
      'delivery',
    ]);

    await patch(session, store.id, { deliveryEnabled: false });
    expect((await storefront(store.handle)).fulfillment).toEqual(['pickup']);

    const order = await app.inject({
      method: 'POST',
      url: `/storefront/${store.handle}/orders`,
      payload: {
        customerName: 'Ana',
        fulfillment: 'delivery',
        address: 'Rua das Flores, 10',
        items: [{ slug: 'bolo', quantity: 1 }],
      },
    });
    expect(order.statusCode).toBe(400);
    expect(order.json().message).toMatch(/não faz entrega/);

    const none = await patch(session, store.id, { pickupEnabled: false });
    expect(none.statusCode).toBe(400);
    expect(none.json().message).toMatch(/pelo menos uma forma/);
  });

  it('sets an accent color with legible text on it, and resets it', async () => {
    const { session, store } = await merchantWithStore(app);

    const light = await patch(session, store.id, { accentColor: '#FFD400' });
    expect(light.json()).toMatchObject({
      accentColor: '#ffd400',
      theme: { colors: { accent: '#ffd400', accentForeground: '#1a1714' } },
    });
    const dark = await patch(session, store.id, { accentColor: '#1e3a8a' });
    expect(dark.json().theme.colors.accentForeground).toBe('#ffffff');
    expect((await storefront(store.handle)).theme.colors.accent).toBe(
      '#1e3a8a',
    );

    const reset = await patch(session, store.id, { accentColor: null });
    expect(reset.json().accentColor).toBeNull();
    expect(reset.json().theme.colors.accent).not.toBe('#1e3a8a');

    const invalid = await patch(session, store.id, { accentColor: 'red' });
    expect(invalid.statusCode).toBe(400);
  });
});
