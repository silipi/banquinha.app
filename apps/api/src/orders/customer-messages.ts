import type { FulfillmentMethod } from '../storefront/dto/create-order.dto.js';
import { totalLine, whatsappUrl } from '../storefront/order-message.js';
import type { OrderCustomerLinksDto } from './dto/order.dto.js';

export type CustomerMessageInput = {
  storeName: string;
  /** Where to pick up orders, when the store set it. */
  locationUrl: string | null;
  number: number;
  customerName: string;
  fulfillment: FulfillmentMethod;
  /** Service orders get wording about an appointment instead of a package. */
  hasServices: boolean;
  address: string | null;
  totalCents: number;
  priceToConfirm: boolean;
};

type CustomerMessages = Record<keyof OrderCustomerLinksDto, string>;

/** Joins lines, leaving out the ones that are null. */
const lines = (...parts: (string | null)[]) =>
  parts.filter((part) => part !== null).join('\n');

/** A blank line and then `text`, or nothing when there is no text. */
const extra = (label: string, text: string | null) =>
  text ? ['', `${label}: ${text}`] : [];

function readyMessage(order: CustomerMessageInput, greeting: string): string {
  const number = `#${order.number}`;
  if (order.hasServices) {
    if (order.fulfillment === 'delivery') {
      return lines(
        `${greeting} Estou a caminho para o atendimento do pedido ${number} 🚗`,
        ...extra('Endereço', order.address),
      );
    }
    if (order.fulfillment === 'online') {
      return `${greeting} Tudo pronto para o seu atendimento online do pedido ${number}. Me avisa quando puder começar 💻`;
    }
    return lines(
      `${greeting} Tudo pronto para o seu atendimento do pedido ${number}. Te espero! 🙌`,
      ...extra('Onde fica', order.locationUrl),
    );
  }
  if (order.fulfillment === 'delivery') {
    return lines(
      `${greeting} Seu pedido ${number} saiu para entrega 🛵`,
      ...extra('Endereço', order.address),
    );
  }
  return lines(
    `${greeting} Seu pedido ${number} está pronto para retirada 🛍️`,
    ...extra('Onde retirar', order.locationUrl),
  );
}

/** The pt-BR messages the merchant sends to the customer at each step of an order. */
export function buildCustomerMessages(
  order: CustomerMessageInput,
): CustomerMessages {
  const firstName = order.customerName.trim().split(/\s+/)[0];
  const greeting = `Olá, ${firstName}!`;

  return {
    chat: `${greeting} Aqui é da loja ${order.storeName}, sobre o seu pedido #${order.number}.`,
    confirmed: lines(
      `${greeting} Seu pedido #${order.number} na loja ${order.storeName} está confirmado ✅`,
      '',
      totalLine(order.totalCents, order.priceToConfirm),
      order.hasServices
        ? 'Qualquer mudança, me avisa por aqui.'
        : order.fulfillment === 'delivery'
          ? 'Te aviso aqui quando sair para entrega.'
          : 'Te aviso aqui quando estiver pronto para retirar.',
    ),
    ready: readyMessage(order, greeting),
    completed: `Obrigado, ${firstName}! 💛 Qualquer coisa sobre o pedido #${order.number}, é só me chamar aqui.`,
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
