import type { ThemeTokensDto } from '@banquinha/api-client';
import { ImageIcon, MessageCircle } from 'lucide-react';
import { StoreAvatar } from '@/app/[handle]/_components/StoreAvatar';
import { formatItemPrice, type PriceType } from '@/lib/item-price';
import { themeStyle } from '@/lib/store-theme';
import { storeDisplayUrl } from '@/lib/storefront-links';

export interface PreviewProduct {
  key: string;
  name: string;
  priceType: PriceType;
  /** 0 while empty. */
  priceCents: number;
}

/**
 * Small live copy of the storefront that follows what the merchant types, so they see
 * the store taking shape while they build it. Renders any theme from its tokens.
 */
export function StorePreview({
  name,
  handle,
  theme,
  products,
}: {
  name: string;
  handle: string;
  theme: ThemeTokensDto | undefined;
  products: PreviewProduct[];
}) {
  const storeName = name.trim() || 'Sua loja';
  const shown =
    products.length > 0
      ? products
      : [
          {
            key: 'empty',
            name: '',
            priceType: 'fixed' as const,
            priceCents: 0,
          },
        ];

  return (
    <div
      className="storefront overflow-hidden rounded-[2rem] border bg-background text-foreground shadow-sm"
      style={theme ? themeStyle(theme) : undefined}
      aria-label="Prévia da sua loja"
    >
      <div className="border-b bg-surface/60 px-4 py-2 text-center text-xs text-muted-foreground">
        {storeDisplayUrl(handle || 'sualoja')}
      </div>
      <div className="flex flex-col items-center px-5 pt-6 pb-6 text-center">
        <StoreAvatar name={storeName} logoUrl={null} size={64} />
        <p className="mt-3 font-display text-xl font-bold tracking-tight text-balance">
          {storeName}
        </p>
        <span className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-store px-3 text-xs font-medium text-store-foreground">
          <MessageCircle className="size-3.5" /> WhatsApp
        </span>
        <div className="mt-5 grid w-full grid-cols-2 gap-3 text-left">
          {shown.slice(0, 4).map((product) => (
            <div key={product.key}>
              <div className="flex aspect-square items-center justify-center rounded-store-sm bg-store-soft text-store/50">
                <ImageIcon className="size-6" />
              </div>
              <p className="mt-2 truncate text-sm font-medium">
                {product.name || 'Seu produto'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatItemPrice(product)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
