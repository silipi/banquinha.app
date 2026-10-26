import {
  formatQuantity,
  isFirmPrice,
  type ItemKind,
  type PriceType,
} from '../products/pricing.js';
import type { DayPeriod, FulfillmentMethod } from './dto/create-order.dto.js';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCents(cents: number): string {
  // Intl uses a non-breaking space after "R$", which some WhatsApp clients render oddly.
  return brl.format(cents / 100).replace(/ /g, ' ');
}

export const DAY_PERIOD_LABELS: Record<DayPeriod, string> = {
  morning: 'manhã',
  afternoon: 'tarde',
  evening: 'noite',
};

const weekdayAndDay = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

/** "2026-10-30" → "sexta-feira, 30/10". */
export function formatPreferredDate(date: string): string {
  return weekdayAndDay.format(new Date(`${date}T12:00:00Z`));
}

/** "Data preferida: sexta-feira, 30/10 (tarde)", or null when the customer chose neither. */
export function preferredTimeLine(
  date: string | null | undefined,
  period: DayPeriod | null | undefined,
): string | null {
  if (date) {
    const when = formatPreferredDate(date);
    return period
      ? `Data preferida: ${when} (${DAY_PERIOD_LABELS[period]})`
      : `Data preferida: ${when}`;
  }
  return period ? `Período preferido: ${DAY_PERIOD_LABELS[period]}` : null;
}

export type OrderMessageItem = {
  name: string;
  kind: ItemKind;
  priceType: PriceType;
  unitPriceCents: number | null;
  quantity: number;
};

/** "2x Samambaia — R$ 50,00", "4 horas · Faxina — R$ 140,00", "1x Montagem — sob orçamento". */
function itemLine(item: OrderMessageItem): string {
  const quantity = formatQuantity(item.priceType, item.quantity);
  const label =
    item.priceType === 'hourly' || item.priceType === 'daily'
      ? `${quantity} · ${item.name}`
      : `${quantity} ${item.name}`;
  if (item.unitPriceCents === null) return `${label} — sob orçamento`;
  if (!isFirmPrice(item.priceType)) {
    return `${label} — a partir de ${formatCents(item.unitPriceCents)}`;
  }
  return `${label} — ${formatCents(item.unitPriceCents * item.quantity)}`;
}

export function totalLine(totalCents: number, priceToConfirm: boolean) {
  if (!priceToConfirm) return `Total: ${formatCents(totalCents)}`;
  return totalCents > 0
    ? `Total: ${formatCents(totalCents)} + itens a combinar`
    : 'Total: a combinar';
}

/** How the order is received, worded for products or for services. */
function fulfillmentLine(
  fulfillment: FulfillmentMethod,
  address: string | null | undefined,
  hasServices: boolean,
): string {
  if (fulfillment === 'online') return 'Atendimento online';
  if (hasServices) {
    return fulfillment === 'delivery'
      ? `Atendimento no meu endereço: ${address}`
      : 'Atendimento no endereço da loja';
  }
  return fulfillment === 'delivery'
    ? `Entrega em: ${address}`
    : 'Vou retirar o pedido';
}

export type OrderMessageInput = {
  storeName: string;
  number: number;
  customerName: string;
  fulfillment: FulfillmentMethod;
  address?: string | null;
  note?: string | null;
  preferredDate?: string | null;
  preferredPeriod?: DayPeriod | null;
  items: OrderMessageItem[];
  totalCents: number;
  priceToConfirm: boolean;
};

/** The pt-BR message the customer sends to the store on WhatsApp. */
export function buildOrderMessage(order: OrderMessageInput): string {
  const hasServices = order.items.some((item) => item.kind === 'service');
  const onlyServices = order.items.every((item) => item.kind === 'service');
  const lines = [
    onlyServices
      ? `Olá! Quero solicitar um serviço na loja ${order.storeName}.`
      : `Olá! Quero fazer um pedido na loja ${order.storeName}.`,
    '',
    `*Pedido #${order.number}*`,
    ...order.items.map(itemLine),
    '',
    `*${totalLine(order.totalCents, order.priceToConfirm)}*`,
    '',
    `Nome: ${order.customerName}`,
    fulfillmentLine(order.fulfillment, order.address, hasServices),
  ];
  const preferred = preferredTimeLine(
    order.preferredDate,
    order.preferredPeriod,
  );
  if (preferred) lines.push(preferred);
  if (order.note) lines.push(`Observação: ${order.note}`);
  return lines.join('\n');
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
