import type { FulfillmentMethod } from './dto/create-order.dto.js';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCents(cents: number): string {
  // Intl uses a non-breaking space after "R$", which some WhatsApp clients render oddly.
  return brl.format(cents / 100).replace(/ /g, ' ');
}

export type OrderMessageInput = {
  storeName: string;
  number: number;
  customerName: string;
  fulfillment: FulfillmentMethod;
  address?: string | null;
  note?: string | null;
  items: { name: string; unitPriceCents: number; quantity: number }[];
  totalCents: number;
};

/** The pt-BR message the customer sends to the store on WhatsApp. */
export function buildOrderMessage(order: OrderMessageInput): string {
  const lines = [
    `Olá! Quero fazer um pedido na loja ${order.storeName}.`,
    '',
    `*Pedido #${order.number}*`,
    ...order.items.map(
      (item) =>
        `${item.quantity}x ${item.name} — ${formatCents(item.unitPriceCents * item.quantity)}`,
    ),
    '',
    `*Total: ${formatCents(order.totalCents)}*`,
    '',
    `Nome: ${order.customerName}`,
    order.fulfillment === 'delivery'
      ? `Entrega em: ${order.address}`
      : 'Vou retirar o pedido',
  ];
  if (order.note) lines.push(`Observação: ${order.note}`);
  return lines.join('\n');
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
