import { buildCustomerMessages, customerLinks } from './customer-messages.js';

describe('buildCustomerMessages', () => {
  const pickup = {
    storeName: 'Plantinhas do Paulo',
    locationUrl: 'https://maps.app.goo.gl/abc',
    number: 7,
    customerName: ' Marina  Souza ',
    fulfillment: 'pickup' as const,
    hasServices: false,
    address: null,
    totalCents: 7800,
    priceToConfirm: false,
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
    expect(messages.completed).toContain('Obrigado, Marina!');
    expect(messages.canceled).toContain(
      'Seu pedido #7 na loja Plantinhas do Paulo foi cancelado.',
    );
  });
});

describe('buildCustomerMessages for services', () => {
  const service = {
    storeName: 'Tech do Rafa',
    locationUrl: null,
    number: 3,
    customerName: 'Ana',
    fulfillment: 'delivery' as const,
    hasServices: true,
    address: 'Rua das Flores, 10',
    totalCents: 12000,
    priceToConfirm: true,
  };

  it('confirms with what is still to settle', () => {
    expect(buildCustomerMessages(service).confirmed).toBe(
      [
        'Olá, Ana! Seu pedido #3 na loja Tech do Rafa está confirmado ✅',
        '',
        'Total: R$ 120,00 + itens a combinar',
        'Qualquer mudança, me avisa por aqui.',
      ].join('\n'),
    );
  });

  it('says the merchant is on the way, or ready to start', () => {
    expect(buildCustomerMessages(service).ready).toBe(
      [
        'Olá, Ana! Estou a caminho para o atendimento do pedido #3 🚗',
        '',
        'Endereço: Rua das Flores, 10',
      ].join('\n'),
    );
    expect(
      buildCustomerMessages({
        ...service,
        fulfillment: 'online',
        address: null,
      }).ready,
    ).toContain('Tudo pronto para o seu atendimento online do pedido #3');
    expect(
      buildCustomerMessages({
        ...service,
        fulfillment: 'pickup',
        address: null,
      }).ready,
    ).toBe(
      'Olá, Ana! Tudo pronto para o seu atendimento do pedido #3. Te espero! 🙌',
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
      hasServices: false,
      address: null,
      totalCents: 1000,
      priceToConfirm: false,
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
