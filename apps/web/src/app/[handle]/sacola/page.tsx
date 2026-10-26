import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getStore } from '@/lib/storefront';
import { BagView } from './BagView';

export const metadata: Metadata = {
  title: 'Sacola',
  robots: { index: false },
};

async function Bag({ params }: Pick<PageProps<'/[handle]/sacola'>, 'params'>) {
  const { handle } = await params;
  const store = await getStore(handle);
  if (!store) notFound();
  return <BagView fulfillment={store.fulfillment} />;
}

export default function BagPage({ params }: PageProps<'/[handle]/sacola'>) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8">
      <Suspense>
        <Bag params={params} />
      </Suspense>
    </main>
  );
}
