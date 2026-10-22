'use server';

import { storefrontCreateOrder, type CreateOrderDto } from '@/lib/api';

export type PlaceOrderResult =
  | { ok: true; number: number; whatsappUrl: string }
  | { ok: false; message: string; unavailableSlugs?: string[] };

type ApiError = { message?: string | string[]; unavailableSlugs?: string[] };

/** Sends the cart to the API, which validates, prices and records the order. */
export async function placeOrder(
  handle: string,
  order: CreateOrderDto,
): Promise<PlaceOrderResult> {
  try {
    const { data, error } = await storefrontCreateOrder({
      path: { handle },
      body: order,
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
