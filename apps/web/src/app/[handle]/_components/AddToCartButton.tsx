'use client';

import { Check, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCart, type CartItem } from './use-cart';

export function AddToCartButton({
  product,
  className,
}: {
  product: Omit<CartItem, 'quantity'>;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timeout = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(timeout);
  }, [added]);

  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        setAdded(true);
      }}
      className={cn(
        'inline-flex h-13 items-center justify-center gap-2 rounded-full bg-store px-7 font-medium text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] [&_svg]:size-5',
        className,
      )}
    >
      {added ? (
        <>
          <Check /> Adicionado à sacola
        </>
      ) : (
        <>
          <ShoppingBag /> Adicionar à sacola
        </>
      )}
    </button>
  );
}
