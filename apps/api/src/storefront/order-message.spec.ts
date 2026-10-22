import {
  buildOrderMessage,
  formatCents,
  whatsappUrl,
} from './order-message.js';

describe('buildOrderMessage', () => {
  const base = {
    storeName: 'Plantinhas do Paulo',
    number: 7,
    customerName: 'Marina',
    items: [
      { name: 'Samambaia', unitPriceCents: 2500, quantity: 2 },
      { name: 'Jiboia', unitPriceCents: 2800, quantity: 1 },
    ],
    totalCents: 7800,
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
