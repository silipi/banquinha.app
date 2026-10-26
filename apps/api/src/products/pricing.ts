import { BadRequestException } from '@nestjs/common';

// How an item of a store is sold and priced. Shared by products, the onboarding and
// orders, which keep a copy of the pricing of each item at the time of the order.

export const ITEM_KINDS = ['product', 'service'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/**
 * fixed: R$ 120 · hourly: R$ 35/hora · daily: R$ 180/diária · from: a partir de R$ 80 ·
 * quote: sob orçamento (no price).
 */
export const PRICE_TYPES = [
  'fixed',
  'hourly',
  'daily',
  'from',
  'quote',
] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

/** Per hour and per day only make sense for services. */
export const PRICE_TYPES_BY_KIND: Record<ItemKind, readonly PriceType[]> = {
  product: ['fixed', 'from', 'quote'],
  service: PRICE_TYPES,
};

/** Whether the price is final and counts in the order total ("from" and "quote" are settled later). */
export const isFirmPrice = (priceType: PriceType) =>
  priceType === 'fixed' || priceType === 'hourly' || priceType === 'daily';

export interface Pricing {
  kind: ItemKind;
  priceType: PriceType;
  /** Null only for "quote". */
  priceCents: number | null;
}

/** Checks a combination of kind and price; "quote" drops any price given. */
export function checkPricing(pricing: {
  kind: ItemKind;
  priceType: PriceType;
  priceCents: number | null | undefined;
}): Pricing {
  const { kind, priceType } = pricing;
  if (!PRICE_TYPES_BY_KIND[kind].includes(priceType)) {
    throw new BadRequestException(
      'Preço por hora ou por dia é só para serviços.',
    );
  }
  if (priceType === 'quote') return { kind, priceType, priceCents: null };
  if (pricing.priceCents == null) {
    throw new BadRequestException('Informe o preço');
  }
  return { kind, priceType, priceCents: pricing.priceCents };
}

/** "4 horas", "1 diária" or "2x", as the quantity of an item reads in a message. */
export function formatQuantity(priceType: PriceType, quantity: number): string {
  if (priceType === 'hourly') {
    return quantity === 1 ? '1 hora' : `${quantity} horas`;
  }
  if (priceType === 'daily') {
    return quantity === 1 ? '1 diária' : `${quantity} diárias`;
  }
  return `${quantity}x`;
}
