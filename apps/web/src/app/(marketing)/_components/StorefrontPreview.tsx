import { MessageCircle, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { examplePrice, type ExampleStore } from '@/lib/example-stores';
import { cn } from '@/lib/utils';

/** Phone mockup showing what a store page looks like. */
export function StorefrontPreview({
  store,
  className,
  priority = false,
}: {
  store: ExampleStore;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        'w-[280px] rounded-[2.5rem] border-[6px] border-ink bg-ink shadow-2xl',
        className,
      )}
    >
      <div className="relative h-[560px] overflow-hidden rounded-[2rem] bg-surface">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" />
        <div className="h-full overflow-hidden px-4 pt-10">
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'relative size-14 overflow-hidden rounded-full',
                store.accent,
              )}
            >
              <Image
                src={`/lojas/${store.handle}/logo.webp`}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-lg leading-tight font-bold">
            {store.name}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {store.tagline}
          </p>
          <div className="mt-3 flex gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-whatsapp px-3 py-1 text-[11px] font-medium text-white">
              <MessageCircle className="size-3" /> WhatsApp
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium">
              {store.city}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {store.products.slice(0, 4).map((product) => (
              <div key={product.name}>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="120px"
                    priority={priority}
                    className="object-cover"
                  />
                </div>
                <p className="mt-1.5 truncate text-[11px] font-medium">
                  {product.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {examplePrice(product)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
