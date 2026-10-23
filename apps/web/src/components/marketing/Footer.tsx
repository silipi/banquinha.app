import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { Logo } from '@/components/logo';

async function CurrentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

const links = [
  { href: '/blog', label: 'Blog' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Privacidade' },
];

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
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:items-end">
          <nav className="-mx-2 flex flex-wrap">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex h-11 items-center px-2 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p>
            © <CurrentYear /> banquinha.app · Feito no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
