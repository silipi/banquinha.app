import {
  buildOrderMessage,
  formatCents,
  formatPreferredDate,
  whatsappUrl,
  type OrderMessageItem,
} from './order-message.js';

const product = (
  name: string,
  unitPriceCents: number,
  quantity: number,
): OrderMessageItem => ({
  name,
  kind: 'product',
  priceType: 'fixed',
  unitPriceCents,
  quantity,
});

describe('buildOrderMessage', () => {
  const base = {
    storeName: 'Plantinhas do Paulo',
    number: 7,
    customerName: 'Marina',
    items: [product('Samambaia', 2500, 2), product('Jiboia', 2800, 1)],
    totalCents: 7800,
    priceToConfirm: false,
  };

  it('lists items, total and pickup', () => {
    expect(buildOrderMessage({ ...base, fulfillment: 'pickup' })).toBe(
      [
        'Olá! Quero fazer um pedido na loja Plantinhas do Paulo.',
        '',
        '*Pedido #7*',
        '2x Samambaia — R$ 50,00',
        '1x Jiboia — R$ 28,00',
        '',
        '*Total: R$ 78,00*',
        '',
        'Nome: Marina',
        'Vou retirar o pedido',
      ].join('\n'),
    );
  });

  it('includes the delivery address and the note', () => {
    const message = buildOrderMessage({
      ...base,
      fulfillment: 'delivery',
      address: 'Rua das Flores, 10',
      note: 'Embrulhar para presente',
    });
    expect(message).toContain('Entrega em: Rua das Flores, 10');
    expect(message.endsWith('Observação: Embrulhar para presente')).toBe(true);
  });
});

describe('buildOrderMessage for services', () => {
  const service = (
    name: string,
    priceType: OrderMessageItem['priceType'],
    unitPriceCents: number | null,
    quantity = 1,
  ): OrderMessageItem => ({
    name,
    kind: 'service',
    priceType,
    unitPriceCents,
    quantity,
  });

  it('prices by hour and day, and leaves the rest to settle', () => {
    expect(
      buildOrderMessage({
        storeName: 'Tech do Rafa',
        number: 3,
        customerName: 'Ana',
        fulfillment: 'delivery',
        address: 'Rua das Flores, 10',
        preferredDate: '2026-10-30',
        preferredPeriod: 'afternoon',
        items: [
          service('Suporte técnico', 'hourly', 6000, 2),
          service('Faxina', 'daily', 18000, 1),
          service('Limpeza de notebook', 'from', 9000),
          service('Montagem de PC', 'quote', null),
        ],
        totalCents: 30000,
        priceToConfirm: true,
      }),
    ).toBe(
      [
        'Olá! Quero solicitar um serviço na loja Tech do Rafa.',
        '',
        '*Pedido #3*',
        '2 horas · Suporte técnico — R$ 120,00',
        '1 diária · Faxina — R$ 180,00',
        '1x Limpeza de notebook — a partir de R$ 90,00',
        '1x Montagem de PC — sob orçamento',
        '',
        '*Total: R$ 300,00 + itens a combinar*',
        '',
        'Nome: Ana',
        'Atendimento no meu endereço: Rua das Flores, 10',
        'Data preferida: sexta-feira, 30/10 (tarde)',
      ].join('\n'),
    );
  });

  it('says when everything is to settle, and words online and the period alone', () => {
    const message = buildOrderMessage({
      storeName: 'Tech do Rafa',
      number: 4,
      customerName: 'Ana',
      fulfillment: 'online',
      preferredPeriod: 'evening',
      items: [service('Montagem de PC', 'quote', null)],
      totalCents: 0,
      priceToConfirm: true,
    });
    expect(message).toContain('*Total: a combinar*');
    expect(message).toContain('Atendimento online');
    expect(message).toContain('Período preferido: noite');
  });
});

describe('formatPreferredDate', () => {
  it('names the weekday', () => {
    expect(formatPreferredDate('2026-11-02')).toBe('segunda-feira, 02/11');
  });
});

describe('formatCents', () => {
  it('uses a regular space after R$', () => {
    expect(formatCents(123456)).toBe('R$ 1.234,56');
  });
});

describe('whatsappUrl', () => {
  it('encodes the message', () => {
    expect(whatsappUrl('5541999999999', 'Olá\n*oi*')).toBe(
      'https://wa.me/5541999999999?text=Ol%C3%A1%0A*oi*',
    );
  });
});
