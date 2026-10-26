import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProduct } from '@/lib/storefront';
import { openGraphDefaults } from '@/lib/site';
import { formatItemPrice } from '@/lib/item-price';
import { productPath, storePath } from '@/lib/storefront-links';
import { AddToCartButton } from '../../_components/AddToCartButton';
import { StoreAvatar } from '../../_components/StoreAvatar';

type Props = PageProps<'/[handle]/produto/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle, slug } = await params;
  const product = await getProduct(handle, slug);
  if (!product) return { title: 'Produto não encontrado' };
  const title = `${product.name} · ${product.store.name}`;
  const description = product.description?.slice(0, 155);
  const url = productPath(product.store.handle, product.slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...openGraphDefaults, title, description, url },
  };
}

async function ProductDetails({ params }: Pick<Props, 'params'>) {
  const { handle, slug } = await params;
  const product = await getProduct(handle, slug);
  if (!product) notFound();

  const { store } = product;
  const price = formatItemPrice(product);
  const [cover, ...gallery] = product.images;

  return (
    <>
      <Link
        href={storePath(store.handle)}
        className="inline-flex items-center gap-3 rounded-full py-1 pr-4 pl-2 text-sm font-medium transition-colors hover:bg-store-soft"
      >
        <ArrowLeft className="size-4" />
        <StoreAvatar name={store.name} logoUrl={store.logoUrl} size={32} />
        {store.name}
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-store bg-store-soft">
            {cover && (
              <Image
                src={cover.url}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover"
              />
            )}
          </div>
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((image) => (
                <div
                  key={image.url}
                  className="relative aspect-square overflow-hidden rounded-store-sm bg-store-soft"
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:pt-4">
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-2xl font-medium text-store">{price}</p>
          {product.description && (
            <p className="mt-6 leading-relaxed text-pretty text-muted-foreground">
              {product.description}
            </p>
          )}
          {product.attributes.length > 0 && (
            <dl className="mt-6 divide-y rounded-store-sm border bg-surface">
              {product.attributes.map((attribute) => (
                <div
                  key={attribute.label}
                  className="flex justify-between gap-4 px-4 py-3 text-sm"
                >
                  <dt className="text-muted-foreground">{attribute.label}</dt>
                  <dd className="text-right font-medium">{attribute.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <AddToCartButton
            className="mt-8 w-full md:w-auto"
            product={{
              slug: product.slug,
              name: product.name,
              kind: product.kind,
              priceType: product.priceType,
              priceCents: product.priceCents,
              imageUrl: cover?.url ?? null,
            }}
          />
        </div>
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="mt-14 grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="aspect-square animate-pulse rounded-store bg-muted" />
      <div className="space-y-3 md:pt-4">
        <div className="h-9 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}
