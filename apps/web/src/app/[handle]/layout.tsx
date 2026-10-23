import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { themeStyle } from '@/lib/store-theme';
import { getStore } from '@/lib/storefront';
import { BagButton } from './_components/BagButton';
import { CartBar } from './_components/CartBar';

async function StoreFrame({
  params,
  children,
}: Pick<LayoutProps<'/[handle]'>, 'params' | 'children'>) {
  const { handle } = await params;
  const store = await getStore(handle);
  if (!store) notFound();

  // The theme tokens repaint everything inside, footer included (src/lib/store-theme.ts).
  return (
    <div
      className="storefront flex flex-1 flex-col bg-background text-foreground"
      style={themeStyle(store.theme)}
    >
      <BagButton />
      {children}
      <footer className="flex justify-center px-4 pt-10 pb-28">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border bg-surface px-4 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          Feito com <Logo className="text-sm" />
        </Link>
      </footer>
      <CartBar />
    </div>
  );
}

function StoreSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-16">
      <div className="size-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-6 h-8 w-56 animate-pulse rounded-full bg-muted" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

export default function StoreLayout({
  params,
  children,
}: LayoutProps<'/[handle]'>) {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <StoreFrame params={params}>{children}</StoreFrame>
    </Suspense>
  );
}
