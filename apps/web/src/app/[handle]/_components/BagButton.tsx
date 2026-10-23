'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bagPath } from '@/lib/storefront-links';
import { useCart } from './use-cart';

/** Always-visible bag shortcut in the top corner of store pages. */
export function BagButton() {
  const { handle, count } = useCart();
  const pathname = usePathname();

  if (pathname === bagPath(handle)) return null;

  return (
    <Link
      href={bagPath(handle)}
      aria-label={
        count > 0
          ? `Sacola com ${count} ${count === 1 ? 'item' : 'itens'}`
          : 'Sacola vazia'
      }
      className="fixed top-4 right-4 z-40 flex size-11 items-center justify-center rounded-full border bg-surface/90 shadow-sm backdrop-blur transition-transform active:scale-95"
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-store px-1 text-xs font-bold text-store-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
