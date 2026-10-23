import Link from 'next/link';
import { Logo } from '@/components/logo';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Logo />
      <h1 className="mt-10 font-display text-4xl font-bold tracking-tight">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        O endereço pode estar errado, ou a loja não existe mais.
      </p>
      <Link href="/" className={buttonVariants({ className: 'mt-8' })}>
        Ir para a banquinha.app
      </Link>
    </main>
  );
}
