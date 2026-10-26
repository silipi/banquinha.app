'use client';

import { Check, MessageSquareText, Plus, ShoppingBag } from 'lucide-react';
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
  const label =
    product.priceType === 'quote'
      ? {
          icon: <MessageSquareText />,
          idle: 'Pedir orçamento',
          done: 'Adicionado',
        }
      : product.kind === 'service'
        ? { icon: <Plus />, idle: 'Quero esse serviço', done: 'Adicionado' }
        : {
            icon: <ShoppingBag />,
            idle: 'Adicionar à sacola',
            done: 'Adicionado à sacola',
          };
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
        'inline-flex h-13 items-center justify-center gap-2 rounded-full bg-store px-7 font-medium text-store-foreground transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] [&_svg]:size-5',
        className,
      )}
    >
      {added ? (
        <>
          <Check /> {label.done}
        </>
      ) : (
        <>
          {label.icon} {label.idle}
        </>
      )}
    </button>
  );
}
