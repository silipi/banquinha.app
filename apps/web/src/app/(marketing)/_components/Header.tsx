import Link from 'next/link';
import { Logo } from '@/components/logo';
import { buttonVariants } from '@/components/ui/button';

const links = [
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/#precos', label: 'Preços' },
  { href: '/#perguntas', label: 'Dúvidas' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-3">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border bg-surface/80 pr-2 pl-5 shadow-sm backdrop-blur">
        <Link href="/" aria-label="vendeu.store, página inicial">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Link href="/cadastro" className={buttonVariants({ size: 'sm' })}>
          Criar minha loja
        </Link>
      </div>
    </header>
  );
}
