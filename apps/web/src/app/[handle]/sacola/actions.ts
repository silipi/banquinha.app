'use server';

import { headers } from 'next/headers';
import { storefrontCreateOrder, type CreateOrderDto } from '@/lib/api';

export type PlaceOrderResult =
  | { ok: true; number: number; whatsappUrl: string }
  | { ok: false; message: string; unavailableSlugs?: string[] };

type ApiError = { message?: string | string[]; unavailableSlugs?: string[] };

/**
 * Orders reach the API from this server, so the API would see our IP for every
 * customer. Forward the customer's IP with the shared key so the API can rate limit
 * per customer (see OrderThrottlerGuard in apps/api).
 */
async function customerHeaders(): Promise<Record<string, string>> {
  const key = process.env.INTERNAL_API_KEY;
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip');
  if (!key || !ip) return {};
  return { 'x-internal-key': key, 'x-client-ip': ip };
}

/** Sends the cart to the API, which validates, prices and records the order. */
export async function placeOrder(
  handle: string,
  order: CreateOrderDto,
): Promise<PlaceOrderResult> {
  try {
    const { data, error } = await storefrontCreateOrder({
      path: { handle },
      body: order,
      headers: await customerHeaders(),
    });
    if (data) {
      return { ok: true, number: data.number, whatsappUrl: data.whatsappUrl };
    }

    const { message, unavailableSlugs } = (error ?? {}) as ApiError;
    return {
      ok: false,
      message: Array.isArray(message)
        ? message[0]!
        : (message ?? 'Não foi possível enviar o pedido.'),
      unavailableSlugs,
    };
  } catch {
    return {
      ok: false,
      message: 'Não foi possível enviar o pedido. Tente de novo em instantes.',
    };
  }
}
