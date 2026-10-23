'use client';

import { authLogout } from '@banquinha/api-client';
import {
  Check,
  ChevronsUpDown,
  Home,
  LogOut,
  Package,
  Receipt,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StoreAvatar } from '@/app/[handle]/_components/StoreAvatar';
import { Logo } from '@/components/logo';
import { panelApi, panelPath } from '@/lib/panel';
import { themeStyle } from '@/lib/store-theme';
import { storeDisplayUrl } from '@/lib/storefront-links';
import { cn } from '@/lib/utils';
import { SETUP_LABELS, usePanel } from './panel-context';

const NAV = [
  { label: 'Início', icon: Home, href: '/', ready: true },
  { label: 'Produtos', icon: Package, href: '/produtos', ready: false },
  { label: 'Pedidos', icon: Receipt, href: '/pedidos', ready: false },
  {
    label: 'Configurações',
    icon: Settings,
    href: '/configuracoes',
    ready: false,
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { me } = usePanel();

  async function logout() {
    await authLogout({ client: panelApi }).catch(() => {});
    router.replace(panelPath('/login'));
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <a href={panelPath('/')} className="px-2 pt-1">
        <Logo />
      </a>

      <StoreSwitcher />

      <nav aria-label="Painel" className="flex flex-col gap-0.5">
        {NAV.map(({ label, icon: Icon, href, ready }) =>
          ready ? (
            <a
              key={label}
              href={panelPath(href)}
              onClick={onNavigate}
              aria-current="page"
              className="flex h-10 items-center gap-3 rounded-xl bg-muted px-3 text-sm font-medium"
            >
              <Icon className="size-4" /> {label}
            </a>
          ) : (
            <span
              key={label}
              className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground"
            >
              <Icon className="size-4" /> {label}
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px]">
                Em breve
              </span>
            </span>
          ),
        )}
      </nav>

      <SetupBadge onNavigate={onNavigate} />

      <div className="mt-auto flex items-center gap-3 border-t pt-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-ink-foreground">
          {(me.name ?? me.email).charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {me.name ?? 'Sua conta'}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {me.email}
          </span>
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Sair"
          title="Sair"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Store picker. One store per account for now; paid plans may allow more. */
function StoreSwitcher() {
  const { me, store, selectStore } = usePanel();
  const [open, setOpen] = useState(false);
  const current = me.stores.find((s) => s.id === store?.id) ?? me.stores[0]!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-3 rounded-2xl border bg-surface p-2.5 text-left hover:bg-muted/60"
      >
        <span
          className="storefront"
          style={store ? themeStyle(store.theme) : undefined}
        >
          <StoreAvatar
            name={current.name}
            logoUrl={store?.logoUrl ?? null}
            size={36}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {current.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {storeDisplayUrl(current.handle)}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Suas lojas"
          className="absolute inset-x-0 top-full z-20 mt-1 rounded-2xl border bg-surface p-1.5 shadow-lg"
        >
          {me.stores.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={s.id === current.id}
              onClick={() => {
                selectStore(s.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              {s.id === current.id && <Check className="size-4" />}
            </button>
          ))}
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Mais de uma loja chega com os planos pagos.
          </p>
        </div>
      )}
    </div>
  );
}

/** Mini wizard: what is left to customize after the onboarding. */
function SetupBadge({ onNavigate }: { onNavigate?: () => void }) {
  const { store } = usePanel();
  if (!store) return null;
  const done = store.setup.filter((step) => step.done).length;
  if (done === store.setup.length) return null;

  return (
    <a
      href={`${panelPath('/')}#personalizar`}
      onClick={onNavigate}
      className="flex flex-col gap-3 rounded-2xl bg-butter p-4 hover:brightness-[0.98]"
    >
      <span className="text-sm font-semibold">Deixe sua loja completa</span>
      <span className="flex gap-1" aria-hidden>
        {store.setup.map((step) => (
          <span
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-ink/10',
              step.done && 'bg-ink',
            )}
          />
        ))}
      </span>
      <ul className="flex flex-col gap-1.5 text-sm">
        {store.setup.map((step) => (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-4 items-center justify-center rounded-full border border-ink/30',
                step.done && 'border-ink bg-ink text-ink-foreground',
              )}
            >
              {step.done && <Check className="size-3" />}
            </span>
            <span className={cn(step.done && 'text-ink/50 line-through')}>
              {SETUP_LABELS[step.id].title}
            </span>
          </li>
        ))}
      </ul>
      <span className="text-xs text-ink/70">
        {done} de {store.setup.length} feitos
      </span>
    </a>
  );
}
