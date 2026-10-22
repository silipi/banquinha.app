import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { exampleStores } from '@/lib/example-stores';
import { storeDisplayUrl, storePath } from '@/lib/storefront-links';
import { cn, formatBRL } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

export function ExampleStores() {
  return (
    <section className="bg-surface px-4 py-24">
      <SectionHeading
        eyebrow="Inspire-se"
        title="Pequenos negócios não precisam parecer pequenos."
        description="Cada loja ganha uma vitrine bonita, com a identidade de quem vende."
      />
      <ul className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
        {exampleStores.map((store) => (
          <li key={store.handle}>
            <Link
              href={storePath(store.handle)}
              className="group block overflow-hidden rounded-3xl border transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <div className={cn('flex items-center gap-3 p-5', store.accent)}>
                <div className="relative size-12 overflow-hidden rounded-full bg-surface">
                  <Image
                    src={`/lojas/${store.handle}/logo.webp`}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-tight font-bold">
                    {store.name}
                  </p>
                  <p className="truncate text-sm text-foreground/60">
                    {storeDisplayUrl(store.handle)}
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" />
                  <span className="sr-only">Ver loja</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5">
                {store.products.slice(0, 4).map((product) => (
                  <div key={product.name}>
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 160px, 45vw"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatBRL(product.price)}
                    </p>
                  </div>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
