import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/app.js';
import type { Db } from '../src/database/database.js';
import { DB } from '../src/database/database.module.js';
import { storeFields } from '../src/database/schema/index.js';
import { PLANS } from '../src/plans/plans.js';
import { as, merchantWithStore } from './support/merchant.js';

interface Field {
  id: string;
  label: string;
  type: string;
  unit: string | null;
  options: string[] | null;
  showOnCard: boolean;
  hidden: boolean;
}

interface FieldList {
  fields: Field[];
  maxFields: number;
}

describe('Custom fields', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  const send = (
    session: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    url: string,
    payload?: object,
  ) => app.inject({ method, url, cookies: as(session), payload });

  const addField = (session: string, storeId: string, payload: object) =>
    send(session, 'POST', `/stores/${storeId}/fields`, payload);

  /** A store with Ano, Km (on the card) and Câmbio (on the card). */
  async function carStore() {
    const { session, store } = await merchantWithStore(app);
    await addField(session, store.id, { label: 'Ano', type: 'number' });
    await addField(session, store.id, {
      label: 'Km',
      type: 'number',
      unit: 'km',
      showOnCard: true,
    });
    const res = await addField(session, store.id, {
      label: 'Câmbio',
      type: 'choice',
      options: ['Manual', 'Automático'],
      showOnCard: true,
    });
    const [year, km, gearbox] = res.json<FieldList>().fields;
    const products = await send(session, 'GET', `/stores/${store.id}/products`);
    const [product] = products.json<{ products: { id: string }[] }>().products;
    return {
      session,
      store,
      year: year!,
      km: km!,
      gearbox: gearbox!,
      product: product!,
    };
  }

  const updateProduct = (
    session: string,
    storeId: string,
    productId: string,
    attributes: object,
  ) =>
    send(session, 'PATCH', `/stores/${storeId}/products/${productId}`, {
      attributes,
    });

  const storefrontProduct = async (handle: string) =>
    (
      await app.inject({
        method: 'GET',
        url: `/storefront/${handle}/products/bolo`,
      })
    ).json<{ attributes: { label: string; value: string }[] }>();

  const storefrontCard = async (handle: string) =>
    (await app.inject({ method: 'GET', url: `/storefront/${handle}` })).json<{
      products: { slug: string; highlights: string[] }[];
    }>().products[0]!;

  it('creates fields in order, with the plan limit', async () => {
    const { session, store } = await merchantWithStore(app);

    const res = await addField(session, store.id, {
      label: ' Km ',
      type: 'number',
      unit: 'km',
      options: ['ignored', 'too'],
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({
      maxFields: PLANS.free.maxFields,
      fields: [
        {
          id: expect.any(String),
          label: 'Km',
          type: 'number',
          unit: 'km',
          options: null,
          showOnCard: false,
          hidden: false,
        },
      ],
    });
    const products = await send(session, 'GET', `/stores/${store.id}/products`);
    expect(products.json<{ fields: Field[] }>().fields).toHaveLength(1);
  });

  it('refuses a repeated name, a choice without options and fields past the limit', async () => {
    const { session, store } = await merchantWithStore(app);
    await addField(session, store.id, { label: 'Ano', type: 'number' });

    const repeated = await addField(session, store.id, {
      label: 'ano',
      type: 'text',
    });
    expect(repeated.statusCode).toBe(409);
    expect(repeated.json()).toMatchObject({
      message: 'Já existe um campo chamado "ano"',
    });

    const noOptions = await addField(session, store.id, {
      label: 'Cor',
      type: 'choice',
      options: ['Prata'],
    });
    expect(noOptions.statusCode).toBe(400);

    await addField(session, store.id, { label: 'Km', type: 'number' });
    await addField(session, store.id, { label: 'Cor', type: 'text' });
    const overLimit = await addField(session, store.id, {
      label: 'Placa',
      type: 'text',
    });
    expect(overLimit.statusCode).toBe(403);
    expect(overLimit.json()).toMatchObject({
      message: `O plano Grátis permite até ${PLANS.free.maxFields} campos. Apague um para criar outro.`,
    });
  });

  it('edits a field but never its type', async () => {
    const { session, store, km } = await carStore();

    const res = await send(
      session,
      'PATCH',
      `/stores/${store.id}/fields/${km.id}`,
      {
        label: 'Quilometragem',
        unit: 'mil km',
        showOnCard: false,
        type: 'text',
      },
    );

    expect(res.statusCode).toBe(200);
    expect(res.json<FieldList>().fields[1]).toMatchObject({
      label: 'Quilometragem',
      type: 'number',
      unit: 'mil km',
      showOnCard: false,
    });
  });

  it('reorders fields with the full list only', async () => {
    const { session, store, year, km, gearbox } = await carStore();

    const partial = await send(
      session,
      'PUT',
      `/stores/${store.id}/fields/order`,
      {
        fieldIds: [gearbox.id, year.id],
      },
    );
    expect(partial.statusCode).toBe(400);

    const res = await send(session, 'PUT', `/stores/${store.id}/fields/order`, {
      fieldIds: [gearbox.id, year.id, km.id],
    });
    expect(res.json<FieldList>().fields.map((f) => f.label)).toEqual([
      'Câmbio',
      'Ano',
      'Km',
    ]);
  });

  it('saves item values and shows them on the storefront', async () => {
    const { session, store, year, km, gearbox, product } = await carStore();

    const res = await updateProduct(session, store.id, product.id, {
      [year.id]: 2019,
      [km.id]: 45000,
      [gearbox.id]: 'Automático',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json<{ attributes: object }>().attributes).toEqual({
      [year.id]: 2019,
      [km.id]: 45000,
      [gearbox.id]: 'Automático',
    });
    expect((await storefrontProduct(store.handle)).attributes).toEqual([
      { label: 'Ano', value: '2019' },
      { label: 'Km', value: '45.000 km' },
      { label: 'Câmbio', value: 'Automático' },
    ]);
    expect((await storefrontCard(store.handle)).highlights).toEqual([
      '45.000 km',
      'Automático',
    ]);
  });

  it('clears a value sent as null and refuses invalid ones', async () => {
    const { session, store, year, km, gearbox, product } = await carStore();
    await updateProduct(session, store.id, product.id, {
      [year.id]: 2019,
      [km.id]: 45000,
    });

    const cleared = await updateProduct(session, store.id, product.id, {
      [year.id]: 2019,
      [km.id]: null,
    });
    expect(cleared.json<{ attributes: object }>().attributes).toEqual({
      [year.id]: 2019,
    });

    const wrongType = await updateProduct(session, store.id, product.id, {
      [year.id]: 'dois mil',
    });
    expect(wrongType.statusCode).toBe(400);
    expect(wrongType.json()).toMatchObject({
      message: 'Valor inválido em "Ano"',
    });

    const wrongOption = await updateProduct(session, store.id, product.id, {
      [gearbox.id]: 'CVT',
    });
    expect(wrongOption.statusCode).toBe(400);

    const otherStore = await carStore();
    const foreign = await updateProduct(session, store.id, product.id, {
      [otherStore.year.id]: 2020,
    });
    expect(foreign.statusCode).toBe(400);
  });

  it('accepts values when creating an item', async () => {
    const { session, store, year } = await carStore();

    const res = await send(session, 'POST', `/stores/${store.id}/products`, {
      name: 'Gol',
      priceCents: 3_500_000,
      attributes: { [year.id]: 2012 },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json<{ attributes: object }>().attributes).toEqual({
      [year.id]: 2012,
    });
  });

  it('stops showing values of an option taken out of a choice', async () => {
    const { session, store, gearbox, product } = await carStore();
    await updateProduct(session, store.id, product.id, {
      [gearbox.id]: 'Automático',
    });

    await send(session, 'PATCH', `/stores/${store.id}/fields/${gearbox.id}`, {
      options: ['Manual', 'CVT'],
    });

    expect((await storefrontProduct(store.handle)).attributes).toEqual([]);
  });

  it('deleting a field deletes its values', async () => {
    const { session, store, year, km, product } = await carStore();
    await updateProduct(session, store.id, product.id, {
      [year.id]: 2019,
      [km.id]: 45000,
    });

    const res = await send(
      session,
      'DELETE',
      `/stores/${store.id}/fields/${year.id}`,
    );
    expect(res.statusCode).toBe(200);
    expect(res.json<FieldList>().fields.map((f) => f.label)).toEqual([
      'Km',
      'Câmbio',
    ]);

    // Re-creating a field with the same name doesn't bring the old value back.
    await addField(session, store.id, { label: 'Ano', type: 'number' });
    const products = await send(session, 'GET', `/stores/${store.id}/products`);
    expect(
      products.json<{ products: { attributes: object }[] }>().products[0]!
        .attributes,
    ).toEqual({ [km.id]: 45000 });
  });

  it('hides fields past the plan limit and keeps their values', async () => {
    const { session, store, year, product } = await carStore();
    await updateProduct(session, store.id, product.id, { [year.id]: 2019 });
    // As after a downgrade: one more field than the plan allows, placed first.
    const db = app.get<Db>(DB);
    const [extra] = await db
      .insert(storeFields)
      .values({ storeId: store.id, label: 'Cor', type: 'text', position: -1 })
      .returning();

    const list = await send(session, 'GET', `/stores/${store.id}/fields`);
    expect(
      list.json<FieldList>().fields.map((f) => [f.label, f.hidden]),
    ).toEqual([
      ['Cor', false],
      ['Ano', false],
      ['Km', false],
      ['Câmbio', true],
    ]);

    const [cor, , km, gearbox] = list.json<FieldList>().fields;
    await send(session, 'PUT', `/stores/${store.id}/fields/order`, {
      fieldIds: [cor!.id, km!.id, gearbox!.id, year.id],
    });
    // Now Ano is past the limit: not editable, not shown, but kept.
    const refused = await updateProduct(session, store.id, product.id, {
      [year.id]: 2020,
    });
    expect(refused.statusCode).toBe(400);
    await updateProduct(session, store.id, product.id, {
      [extra!.id]: 'Prata',
    });
    expect((await storefrontProduct(store.handle)).attributes).toEqual([
      { label: 'Cor', value: 'Prata' },
    ]);

    await send(session, 'DELETE', `/stores/${store.id}/fields/${extra!.id}`);
    expect((await storefrontProduct(store.handle)).attributes).toEqual([
      { label: 'Ano', value: '2019' },
    ]);
  });

  it("is 404 for another merchant's store or field", async () => {
    const { store, km } = await carStore();
    const other = await merchantWithStore(app);

    expect(
      (await send(other.session, 'GET', `/stores/${store.id}/fields`))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await send(
          other.session,
          'DELETE',
          `/stores/${other.store.id}/fields/${km.id}`,
        )
      ).statusCode,
    ).toBe(404);
  });
});
