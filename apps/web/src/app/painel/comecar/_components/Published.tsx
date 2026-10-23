'use client';

import type { StoreSummaryDto } from '@banquinha/api-client';
import { Check, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { panelPath } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { storeDisplayUrl, storePath } from '@/lib/storefront-links';

/**
 * End of the onboarding: a moment to celebrate with the next useful thing to do
 * (share the link), instead of dropping people on an empty dashboard.
 */
export function Published({ store }: { store: StoreSummaryDto }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(storePath(store.handle));
  const shareText = `Minha loja está no ar! Confira: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (some in-app browsers): the link stays visible to copy by hand.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 pt-5">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pt-12 pb-16 text-center">
        <p className="text-6xl" aria-hidden>
          🎉
        </p>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-balance">
          Sua loja está no ar!
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          <strong className="text-foreground">{store.name}</strong> já pode
          receber pedidos. Compartilhe o link onde seus clientes estão.
        </p>

        <div className="mt-8 flex w-full items-center gap-2 rounded-2xl border bg-surface p-2 pl-4">
          <span className="min-w-0 flex-1 truncate text-left font-medium">
            {storeDisplayUrl(store.handle)}
          </span>
          <Button size="sm" variant="outline" onClick={() => void copy()}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>

        <div className="mt-4 grid w-full gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              size: 'lg',
              className: 'bg-whatsapp text-white hover:bg-whatsapp/90',
            })}
          >
            <MessageCircle /> Compartilhar no WhatsApp
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
          >
            <ExternalLink /> Ver minha loja
          </a>
        </div>

        <p className="mt-8 text-sm text-pretty text-muted-foreground">
          Dica: coloque o link na bio do Instagram. É por lá que a maioria dos
          clientes chega.
        </p>

        <Button
          variant="ghost"
          className="mt-6"
          onClick={() => router.replace(panelPath('/'))}
        >
          Ir para o painel
        </Button>
      </main>
    </div>
  );
}
