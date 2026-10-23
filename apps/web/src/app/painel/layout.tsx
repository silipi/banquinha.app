import type { Metadata } from 'next';
import { Logo } from '@/components/logo';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · banquinha.app' },
  robots: { index: false, follow: false },
};

// Merchant area, served at app.banquinha.app (see the host rewrite in next.config.ts).
export default function PanelLayout({ children }: LayoutProps<'/painel'>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-5">
        <a href={absoluteUrl('/')} aria-label="banquinha.app, página inicial">
          <Logo />
        </a>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-6 pb-16 sm:pt-16">
        {children}
      </main>
    </div>
  );
}
