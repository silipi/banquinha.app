'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { storePath } from '@/lib/storefront-links';

/** Rendered inside the store layout when a product does not exist. */
export default function ProductNotFound() {
  const { handle } = useParams<{ handle: string }>();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Produto não encontrado
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        Esse produto pode ter esgotado ou saído da loja.
      </p>
      <Link
        href={storePath(handle)}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-store px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Voltar para a loja
      </Link>
    </main>
  );
}
