import { cacheLife } from 'next/cache';
import { Logo } from '@/components/logo';

async function CurrentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

export function Footer() {
  return (
    <footer className="border-t px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Logo className="text-lg" />
          <p className="text-sm text-muted-foreground">
            Sua loja online, pronta em minutos.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          © <CurrentYear /> vendeu.store · Feito no Brasil
        </p>
      </div>
    </footer>
  );
}
