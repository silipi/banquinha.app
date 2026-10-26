import type { ProductDto } from '@banquinha/api-client';
import { formatBRL } from './utils';

// Display helpers for the pricing the API returns (rules in apps/api/src/products/pricing.ts).

export type ItemKind = ProductDto['kind'];
export type PriceType = ProductDto['priceType'];

export interface ItemPricing {
  priceType: PriceType;
  /** Null for "quote". */
  priceCents: number | null;
}

/** Price types each kind may use, in the order the panel offers them. */
export const PRICE_TYPES_BY_KIND: Record<ItemKind, PriceType[]> = {
  product: ['fixed', 'from', 'quote'],
  service: ['fixed', 'hourly', 'daily', 'from', 'quote'],
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  fixed: 'Preço fixo',
  hourly: 'Por hora',
  daily: 'Por dia',
  from: 'A partir de',
  quote: 'Sob orçamento',
};

/** Whether the price is final and counts in the total ("from" and "quote" are settled later). */
export const isFirmPrice = (priceType: PriceType) =>
  priceType === 'fixed' || priceType === 'hourly' || priceType === 'daily';

/** "R$ 120,00", "R$ 35,00/hora", "R$ 180,00/diária", "a partir de R$ 80,00" or "Sob orçamento". */
export function formatItemPrice({ priceType, priceCents }: ItemPricing) {
  if (priceType === 'quote' || priceCents === null) return 'Sob orçamento';
  const price = formatBRL(priceCents / 100);
  switch (priceType) {
    case 'hourly':
      return `${price}/hora`;
    case 'daily':
      return `${price}/diária`;
    case 'from':
      return `a partir de ${price}`;
    default:
      return price;
  }
}

/** "2 horas", "1 diária", or just the number for other price types. */
export function formatQuantity(priceType: PriceType, quantity: number) {
  if (priceType === 'hourly') {
    return quantity === 1 ? '1 hora' : `${quantity} horas`;
  }
  if (priceType === 'daily') {
    return quantity === 1 ? '1 diária' : `${quantity} diárias`;
  }
  return String(quantity);
}

/** The line total for firm prices, or how the price reads for the others. */
export function formatLineTotal(item: ItemPricing & { quantity: number }) {
  if (!isFirmPrice(item.priceType) || item.priceCents === null) {
    return formatItemPrice(item);
  }
  return formatBRL((item.priceCents * item.quantity) / 100);
}

/** "R$ 150,00", "R$ 150,00 + a combinar" or "A combinar". */
export function formatTotal(totalCents: number, priceToConfirm: boolean) {
  if (!priceToConfirm) return formatBRL(totalCents / 100);
  return totalCents > 0
    ? `${formatBRL(totalCents / 100)} + a combinar`
    : 'A combinar';
}
