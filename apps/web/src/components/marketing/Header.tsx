import Link from 'next/link';
import { Logo } from '@/components/logo';
import { buttonVariants } from '@/components/ui/button';
import { MobileMenu } from './MobileMenu';

const links = [
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/#precos', label: 'Preços' },
  { href: '/#perguntas', label: 'Dúvidas' },
  { href: '/blog', label: 'Blog' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-3">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-full border bg-surface/80 pr-1.5 pl-5 shadow-sm backdrop-blur">
        <Link
          href="/"
          aria-label="banquinha.app, página inicial"
          className="flex h-11 items-center"
        >
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
        <div className="flex items-center gap-1">
          <Link
            href="/cadastro"
            className={buttonVariants({ size: 'md', className: 'px-4' })}
          >
            <span className="sm:hidden">Criar loja</span>
            <span className="hidden sm:inline">Criar minha loja</span>
          </Link>
          <MobileMenu links={links} />
        </div>
      </div>
    </header>
  );
}
