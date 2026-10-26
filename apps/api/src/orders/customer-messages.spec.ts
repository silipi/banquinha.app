import { buildCustomerMessages, customerLinks } from './customer-messages.js';

describe('buildCustomerMessages', () => {
  const pickup = {
    storeName: 'Plantinhas do Paulo',
    locationUrl: 'https://maps.app.goo.gl/abc',
    number: 7,
    customerName: ' Marina  Souza ',
    fulfillment: 'pickup' as const,
    address: null,
    totalCents: 7800,
  };

  it('greets by first name and names the order', () => {
    expect(buildCustomerMessages(pickup).chat).toBe(
      'Olá, Marina! Aqui é da loja Plantinhas do Paulo, sobre o seu pedido #7.',
    );
  });

  it('confirms with the total and what comes next', () => {
    expect(buildCustomerMessages(pickup).confirmed).toBe(
      [
        'Olá, Marina! Seu pedido #7 na loja Plantinhas do Paulo está confirmado ✅',
        '',
        'Total: R$ 78,00',
        'Te aviso aqui quando estiver pronto para retirar.',
      ].join('\n'),
    );
  });

  it('says where to pick up when the store has a location', () => {
    expect(buildCustomerMessages(pickup).ready).toBe(
      [
        'Olá, Marina! Seu pedido #7 está pronto para retirada 🛍️',
        '',
        'Onde retirar: https://maps.app.goo.gl/abc',
      ].join('\n'),
    );
    expect(buildCustomerMessages({ ...pickup, locationUrl: null }).ready).toBe(
      'Olá, Marina! Seu pedido #7 está pronto para retirada 🛍️',
    );
  });

  it('says the order is on its way for delivery', () => {
    const messages = buildCustomerMessages({
      ...pickup,
      fulfillment: 'delivery',
      address: 'Rua das Flores, 10',
    });
    expect(messages.ready).toBe(
      [
        'Olá, Marina! Seu pedido #7 saiu para entrega 🛵',
        '',
        'Endereço: Rua das Flores, 10',
      ].join('\n'),
    );
    expect(messages.confirmed).toContain(
      'Te aviso aqui quando sair para entrega.',
    );
  });

  it('thanks and cancels', () => {
    const messages = buildCustomerMessages(pickup);
    expect(messages.completed).toContain('Obrigado pela compra, Marina!');
    expect(messages.canceled).toContain(
      'Seu pedido #7 na loja Plantinhas do Paulo foi cancelado.',
    );
  });
});

describe('customerLinks', () => {
  it('turns every message into a wa.me link to the customer', () => {
    const links = customerLinks('5541999999999', {
      storeName: 'Luluca',
      locationUrl: null,
      number: 1,
      customerName: 'Ana',
      fulfillment: 'pickup',
      address: null,
      totalCents: 1000,
    });
    expect(Object.keys(links).sort()).toEqual(
      ['canceled', 'chat', 'completed', 'confirmed', 'ready'].sort(),
    );
    const chat = new URL(links.chat);
    expect(chat.origin + chat.pathname).toBe('https://wa.me/5541999999999');
    expect(chat.searchParams.get('text')).toBe(
      'Olá, Ana! Aqui é da loja Luluca, sobre o seu pedido #1.',
    );
  });
});
