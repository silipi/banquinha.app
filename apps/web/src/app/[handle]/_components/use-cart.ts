'use client';

import { useParams } from 'next/navigation';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { isFirmPrice, type ItemKind, type PriceType } from '@/lib/item-price';

// The cart lives in localStorage, one per store. Prices here are for display only:
// the API reprices the order when it is placed.

export type CartItem = {
  slug: string;
  name: string;
  kind: ItemKind;
  priceType: PriceType;
  /** Null for "quote". */
  priceCents: number | null;
  imageUrl: string | null;
  quantity: number;
};

export const MAX_ITEM_QUANTITY = 99;

const storageKey = (handle: string) => `banquinha:cart:${handle}`;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

// useSyncExternalStore needs a stable snapshot, so parsed carts are cached by their raw value.
const snapshots = new Map<string, { raw: string; items: CartItem[] }>();

function readCart(handle: string): CartItem[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey(handle));
  } catch {
    // Storage can be blocked (private mode); behave as an empty cart.
  }
  if (!raw) return EMPTY;

  const cached = snapshots.get(handle);
  if (cached?.raw === raw) return cached.items;

  let items = EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    // Carts saved before services existed have no kind or price type.
    if (Array.isArray(parsed)) {
      items = (parsed as CartItem[]).map((item) => ({
        ...item,
        kind: item.kind ?? 'product',
        priceType: item.priceType ?? 'fixed',
      }));
    }
  } catch {
    // Corrupt value; start over.
  }
  snapshots.set(handle, { raw, items });
  return items;
}

function writeCart(handle: string, items: CartItem[]) {
  try {
    if (items.length === 0) localStorage.removeItem(storageKey(handle));
    else localStorage.setItem(storageKey(handle), JSON.stringify(items));
  } catch {
    // Ignore: the cart just won't persist.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keeps carts in sync across tabs.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity)));

/** Cart of the current store. `items` is null until it has been read from storage. */
export function useCart() {
  const { handle } = useParams<{ handle: string }>();

  const items = useSyncExternalStore(
    subscribe,
    () => readCart(handle),
    () => null,
  );

  const add = useCallback(
    (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
      const current = readCart(handle);
      const existing = current.find((item) => item.slug === product.slug);
      writeCart(
        handle,
        existing
          ? current.map((item) =>
              item === existing
                ? {
                    ...product,
                    quantity: clampQuantity(item.quantity + quantity),
                  }
                : item,
            )
          : [...current, { ...product, quantity: clampQuantity(quantity) }],
      );
    },
    [handle],
  );

  const setQuantity = useCallback(
    (slug: string, quantity: number) => {
      writeCart(
        handle,
        readCart(handle).map((item) =>
          item.slug === slug
            ? { ...item, quantity: clampQuantity(quantity) }
            : item,
        ),
      );
    },
    [handle],
  );

  const remove = useCallback(
    (slugs: string[]) => {
      writeCart(
        handle,
        readCart(handle).filter((item) => !slugs.includes(item.slug)),
      );
    },
    [handle],
  );

  const clear = useCallback(() => writeCart(handle, []), [handle]);

  const summary = useMemo(() => {
    const list = items ?? [];
    return {
      count: list.reduce((sum, item) => sum + item.quantity, 0),
      /** Items with a firm price only; see priceToConfirm. */
      subtotalCents: list.reduce(
        (sum, item) =>
          isFirmPrice(item.priceType) && item.priceCents !== null
            ? sum + item.priceCents * item.quantity
            : sum,
        0,
      ),
      /** Some items are priced "from" or "quote", to be settled with the store. */
      priceToConfirm: list.some((item) => !isFirmPrice(item.priceType)),
      hasServices: list.some((item) => item.kind === 'service'),
      /** A request for services rather than a bag of products. */
      onlyServices:
        list.length > 0 && list.every((item) => item.kind === 'service'),
    };
  }, [items]);

  return { handle, items, ...summary, add, setQuantity, remove, clear };
}
