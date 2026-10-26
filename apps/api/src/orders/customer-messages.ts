import { formatCents, whatsappUrl } from '../storefront/order-message.js';
import type { OrderCustomerLinksDto } from './dto/order.dto.js';

export type CustomerMessageInput = {
  storeName: string;
  /** Where to pick up orders, when the store set it. */
  locationUrl: string | null;
  number: number;
  customerName: string;
  fulfillment: 'pickup' | 'delivery';
  address: string | null;
  totalCents: number;
};

type CustomerMessages = Record<keyof OrderCustomerLinksDto, string>;

/** The pt-BR messages the merchant sends to the customer at each step of an order. */
export function buildCustomerMessages(
  order: CustomerMessageInput,
): CustomerMessages {
  const firstName = order.customerName.trim().split(/\s+/)[0];
  const pickup = order.fulfillment === 'pickup';
  const lines = (...parts: (string | false | null)[]) =>
    parts.filter((part) => part !== false && part !== null).join('\n');

  return {
    chat: `Olá, ${firstName}! Aqui é da loja ${order.storeName}, sobre o seu pedido #${order.number}.`,
    confirmed: lines(
      `Olá, ${firstName}! Seu pedido #${order.number} na loja ${order.storeName} está confirmado ✅`,
      '',
      `Total: ${formatCents(order.totalCents)}`,
      pickup
        ? 'Te aviso aqui quando estiver pronto para retirar.'
        : 'Te aviso aqui quando sair para entrega.',
    ),
    ready: pickup
      ? lines(
          `Olá, ${firstName}! Seu pedido #${order.number} está pronto para retirada 🛍️`,
          order.locationUrl && '',
          order.locationUrl && `Onde retirar: ${order.locationUrl}`,
        )
      : lines(
          `Olá, ${firstName}! Seu pedido #${order.number} saiu para entrega 🛵`,
          order.address && '',
          order.address && `Endereço: ${order.address}`,
        ),
    completed: `Obrigado pela compra, ${firstName}! 💛 Qualquer coisa sobre o pedido #${order.number}, é só me chamar aqui.`,
    canceled: `Olá, ${firstName}. Seu pedido #${order.number} na loja ${order.storeName} foi cancelado. Se quiser, me chama aqui para a gente ver outra opção.`,
  };
}

/** wa.me links to the customer, each with its message ready to send. */
export function customerLinks(
  customerWhatsapp: string,
  order: CustomerMessageInput,
): OrderCustomerLinksDto {
  const messages = buildCustomerMessages(order);
  const link = (message: string) => whatsappUrl(customerWhatsapp, message);
  return {
    chat: link(messages.chat),
    confirmed: link(messages.confirmed),
    ready: link(messages.ready),
    completed: link(messages.completed),
    canceled: link(messages.canceled),
  };
}
