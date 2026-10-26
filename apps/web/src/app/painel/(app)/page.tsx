'use client';

import {
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Package,
} from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
