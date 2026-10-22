'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bagPath } from '@/lib/storefront-links';
import { formatBRL } from '@/lib/utils';
import { useCart } from './use-cart';

/** Floating shortcut to the bag, shown on store pages once something is in it. */
export function CartBar() {
  const { handle, count, subtotalCents } = useCart();
  const pathname = usePathname();

  if (count === 0 || pathname === bagPath(handle)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Link
        href={bagPath(handle)}
        className="pointer-events-auto flex h-14 w-full max-w-md items-center gap-3 rounded-full bg-ink pr-6 pl-2 text-ink-foreground shadow-2xl transition-transform active:scale-[0.98]"
      >
        <span className="relative flex size-10 items-center justify-center rounded-full bg-store">
          <ShoppingBag className="size-5 text-white" />
          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-surface text-xs font-bold text-foreground">
            {count}
          </span>
        </span>
        <span className="flex-1 font-medium">Ver sacola</span>
        <span className="font-medium">{formatBRL(subtotalCents / 100)}</span>
      </Link>
    </div>
  );
}
