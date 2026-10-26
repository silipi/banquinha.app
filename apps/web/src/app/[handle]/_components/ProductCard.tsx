import type { StorefrontProductSummaryDto } from '@banquinha/api-client';
import Image from 'next/image';
import Link from 'next/link';
import { formatItemPrice } from '@/lib/item-price';
import { productPath } from '@/lib/storefront-links';

export function ProductCard({
  handle,
  product,
  priority,
}: {
  handle: string;
  product: StorefrontProductSummaryDto;
  priority?: boolean;
}) {
  return (
    <Link href={productPath(handle, product.slug)} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-store bg-store-soft">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 300px, 45vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <p className="mt-3 truncate font-medium">{product.name}</p>
      <p className="text-sm text-muted-foreground">
        {formatItemPrice(product)}
      </p>
    </Link>
  );
}
