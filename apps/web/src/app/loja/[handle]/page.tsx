import type { Metadata } from 'next';
import { AtSign, MapPin, MessageCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getStore } from '@/lib/storefront';
import { instagramLink, whatsappLink } from '@/lib/storefront-links';
import { cn } from '@/lib/utils';
import { ProductCard } from './_components/ProductCard';
import { StoreAvatar } from './_components/StoreAvatar';

type Props = PageProps<'/loja/[handle]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const store = await getStore(handle);
  if (!store) return { title: 'Loja não encontrada' };
  return {
    title: store.name,
    description: store.bio ?? `Confira os produtos de ${store.name}.`,
  };
}

const pill =
  'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-opacity [&_svg]:size-4';

async function StoreHome({ params }: Pick<Props, 'params'>) {
  const { handle } = await params;
  const store = await getStore(handle);
  if (!store) notFound();

  const { contact } = store;

  return (
    <>
      <header className="flex flex-col items-center text-center">
        <StoreAvatar
          name={store.name}
          logoUrl={store.logoUrl}
          size={96}
          className="ring-4 ring-surface"
        />
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-balance">
          {store.name}
        </h1>
        {store.bio && (
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">
            {store.bio}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href={whatsappLink(
              contact.whatsapp,
              `Olá! Vim pela loja ${store.name}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(pill, 'bg-store text-white hover:opacity-85')}
          >
            <MessageCircle /> WhatsApp
          </a>
          {contact.instagram && (
            <a
              href={instagramLink(contact.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(pill, 'bg-store-soft hover:opacity-85')}
            >
              <AtSign /> {contact.instagram}
            </a>
          )}
          {contact.locationUrl ? (
            <a
              href={contact.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(pill, 'bg-store-soft hover:opacity-85')}
            >
              <MapPin /> {store.city ?? 'Localização'}
            </a>
          ) : (
            store.city && (
              <span className={cn(pill, 'bg-store-soft')}>
                <MapPin /> {store.city}
              </span>
            )
          )}
        </div>
      </header>

      {store.products.length > 0 ? (
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {store.products.map((product, index) => (
            <li key={product.slug}>
              <ProductCard
                handle={store.handle}
                product={product}
                priority={index < 4}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 rounded-3xl bg-store-soft p-10 text-center text-muted-foreground">
          Essa loja ainda não tem produtos. Volte em breve!
        </p>
      )}
    </>
  );
}

function StoreHomeSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-3xl bg-muted"
        />
      ))}
    </div>
  );
}

export default function StorePage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-16">
      <Suspense fallback={<StoreHomeSkeleton />}>
        <StoreHome params={params} />
      </Suspense>
    </main>
  );
}
