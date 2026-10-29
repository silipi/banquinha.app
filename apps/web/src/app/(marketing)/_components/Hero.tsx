import { Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { exampleStores } from '@/lib/example-stores';
import { storePath } from '@/lib/storefront-links';
import { ClaimHandle } from './ClaimHandle';
import { StorefrontPreview } from './StorefrontPreview';

export function Hero() {
  const [store] = exampleStores;

  return (
    <section className="px-4 pt-14 pb-20 md:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
            Grátis para começar
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.02] font-bold tracking-tight text-balance md:text-7xl">
            Sua loja online, pronta em minutos.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0">
            Monte sua vitrine, coloque o link na bio e receba pedidos direto no
            seu WhatsApp. Sem precisar entender nada de site.
          </p>
          <ClaimHandle className="mx-auto mt-8 lg:mx-0" />
          <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
            {[
              'Sem cartão de crédito',
              'Pronta pelo celular',
              'Sem taxa por venda',
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="size-4 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto">
          <div className="absolute inset-x-[-15%] top-[10%] bottom-[5%] -z-10 rounded-full bg-sage blur-3xl" />
          {store && (
            <Link
              href={storePath(store.handle)}
              aria-label={`Ver a loja ${store.name}`}
              className="block rounded-[2.5rem] transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <StorefrontPreview store={store} priority />
            </Link>
          )}
          <div className="absolute top-60 -left-24 hidden w-60 rounded-2xl border bg-surface p-3 shadow-xl sm:block">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                <MessageCircle className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Novo pedido!</p>
                <p className="truncate text-xs text-muted-foreground">
                  Marina pediu 3 marmitas · R$ 70,00
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 bottom-20 hidden rounded-2xl border bg-surface px-4 py-3 shadow-xl sm:block">
            <p className="text-xs text-muted-foreground">Vendas da semana</p>
            <p className="font-display text-2xl font-bold">R$ 1.240</p>
          </div>
        </div>
      </div>
    </section>
  );
}
