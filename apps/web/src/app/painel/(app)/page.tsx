'use client';

import {
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Package,
  PartyPopper,
  Receipt,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { panelPath } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { storeDisplayUrl, storePath } from '@/lib/storefront-links';
import { usePanel } from './_components/panel-context';
import { StoreBuilder } from './_components/StoreBuilder';

export default function DashboardPage() {
  const { me, store } = usePanel();
  const firstName = me.name?.split(' ')[0];

  if (!store) {
    return (
      <LoaderCircle
        className="size-6 animate-spin text-muted-foreground"
        aria-label="Carregando"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {firstName ? `Olá, ${firstName}!` : 'Olá!'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Este é o painel da {store.name}.
        </p>
      </header>

      <FirstOrderCelebration
        key={store.id}
        storeId={store.id}
        orderCount={store.orderCount}
      />

      <StoreLinkCard handle={store.handle} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border bg-surface p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="size-4" /> Produtos
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {store.productCount}
            <span className="text-base font-normal text-muted-foreground">
              {' '}
              de {store.maxProducts}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            no plano {me.plan.name}
          </p>
          <a
            href={panelPath('/produtos')}
            className={buttonVariants({
              size: 'sm',
              variant: 'outline',
              className: 'mt-4',
            })}
          >
            Gerenciar produtos
          </a>
        </div>
        <div className="rounded-3xl border bg-surface p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="size-4" /> Pedidos
          </p>
          <p className="mt-2 font-display text-3xl font-bold">
            {store.newOrderCount}
            <span className="text-base font-normal text-muted-foreground">
              {' '}
              {store.newOrderCount === 1 ? 'novo' : 'novos'}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {store.orderCount === 0
              ? 'Nenhum pedido ainda'
              : `${store.orderCount} no total`}
          </p>
          <a
            href={panelPath('/pedidos')}
            className={buttonVariants({
              size: 'sm',
              variant: 'outline',
              className: 'mt-4',
            })}
          >
            Ver pedidos
          </a>
        </div>
      </div>

      <StoreBuilder />
    </div>
  );
}

function StoreLinkCard({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(storePath(handle));

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <section className="rounded-3xl bg-ink p-5 text-ink-foreground">
      <p className="flex items-center gap-2 text-sm text-ink-foreground/70">
        <span className="size-2 rounded-full bg-whatsapp" /> Sua loja está no ar
      </p>
      <p className="mt-2 font-display text-2xl font-bold break-all">
        {storeDisplayUrl(handle)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-ink-foreground/20 bg-transparent text-ink-foreground hover:bg-ink-foreground/10"
          onClick={() => void copy()}
        >
          {copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar link'}
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            size: 'sm',
            variant: 'outline',
            className:
              'border-ink-foreground/20 bg-transparent text-ink-foreground hover:bg-ink-foreground/10',
          })}
        >
          <ExternalLink /> Ver loja
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Conheça minha loja: ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            size: 'sm',
            className: 'bg-whatsapp text-white hover:bg-whatsapp/90',
          })}
        >
          <MessageCircle /> Compartilhar
        </a>
      </div>
    </section>
  );
}

const celebratedKey = (storeId: string) =>
  `banquinha:first-order-celebrated:${storeId}`;

/**
 * Peak moment of the activation: shown once the first order arrives, until the
 * merchant dismisses it (remembered on this device).
 */
function FirstOrderCelebration({
  storeId,
  orderCount,
}: {
  storeId: string;
  orderCount: number;
}) {
  // The dashboard only renders in the browser (it waits for the session), so the
  // initial read can use localStorage directly.
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(celebratedKey(storeId)) !== null;
    } catch {
      return false;
    }
  });

  if (orderCount === 0 || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(celebratedKey(storeId), new Date().toISOString());
    } catch {}
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-butter p-5 pr-12">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full hover:bg-ink/10"
      >
        <X className="size-4" />
      </button>
      <PartyPopper className="size-8" />
      <h2 className="mt-3 font-display text-2xl font-bold">
        {orderCount === 1
          ? 'Seu primeiro pedido chegou!'
          : 'Seus primeiros pedidos chegaram!'}
      </h2>
      <p className="mt-1 max-w-md text-pretty">
        Parabéns, sua loja já está vendendo. Combine o pagamento e a entrega com
        o cliente no WhatsApp e acompanhe o pedido por aqui.
      </p>
      <a
        href={panelPath('/pedidos')}
        onClick={dismiss}
        className={buttonVariants({ size: 'sm', className: 'mt-4' })}
      >
        Ver {orderCount === 1 ? 'o pedido' : 'os pedidos'}
      </a>
    </section>
  );
}
