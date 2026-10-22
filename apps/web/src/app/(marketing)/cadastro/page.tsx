import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Criar loja' };

// Placeholder until phase 2 (merchant sign-up and dashboard).
async function ChosenHandle({
  searchParams,
}: Pick<PageProps<'/cadastro'>, 'searchParams'>) {
  const { loja } = await searchParams;
  if (typeof loja !== 'string') return null;
  return (
    <p className="mt-4 text-lg">
      Endereço escolhido: <strong>{loja}.vendeu.store</strong>
    </p>
  );
}

export default function SignupPage({ searchParams }: PageProps<'/cadastro'>) {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold">
        O cadastro abre em breve.
      </h1>
      <Suspense>
        <ChosenHandle searchParams={searchParams} />
      </Suspense>
      <Link href="/" className={buttonVariants({ className: 'mt-8' })}>
        Voltar
      </Link>
    </section>
  );
}
