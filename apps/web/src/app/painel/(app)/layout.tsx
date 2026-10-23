'use client';

import { LoaderCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { usePanelMe } from '../_components/use-panel-me';
import { PanelProvider } from './_components/panel-context';
import { Sidebar } from './_components/Sidebar';

// Dashboard shell: sidebar on desktop, top bar with a drawer on phones.
// Merchants who haven't finished the onboarding are sent to it first.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = usePanelMe('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  if (!me) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <PanelProvider me={me}>
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r bg-surface/50 md:block">
          <Sidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-ink/30"
            />
            <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-background shadow-xl">
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-3 flex size-9 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
            <Logo />
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
              className="flex size-10 items-center justify-center rounded-full hover:bg-muted"
            >
              <Menu className="size-5" />
            </button>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-10 md:py-12">
            {children}
          </main>
        </div>
      </div>
    </PanelProvider>
  );
}
