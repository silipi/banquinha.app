'use client';

import { storesUpdate } from '@banquinha/api-client';
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  MessageCircle,
  Package,
  Text,
} from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { storeDisplayUrl, storePath } from '@/lib/storefront-links';
import { cn } from '@/lib/utils';
import { refreshStorefront } from '../actions';
import { SETUP_LABELS, usePanel } from './_components/panel-context';

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

      <SetupCard />
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

const SETUP_ICONS = { logo: ImageIcon, banner: ImageIcon, description: Text };

/** Full version of the sidebar's mini wizard, with the items that can be done here. */
function SetupCard() {
  const { store } = usePanel();
  if (!store) return null;
  const done = store.setup.filter((step) => step.done).length;

  return (
    <section
      id="personalizar"
      className="scroll-mt-8 rounded-3xl border bg-surface p-5"
    >
      <h2 className="font-display text-xl font-bold">
        Deixe sua loja completa
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {done === store.setup.length
          ? 'Tudo pronto. Sua loja está caprichada!'
          : `${done} de ${store.setup.length} feitos. Lojas completas passam mais confiança.`}
      </p>
      <ul className="mt-4 flex flex-col divide-y">
        {store.setup.map((step) => {
          const Icon = SETUP_ICONS[step.id];
          return (
            <li key={step.id} className="flex flex-col gap-3 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted',
                    step.done && 'bg-sage',
                  )}
                >
                  {step.done ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {SETUP_LABELS[step.id].title}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {SETUP_LABELS[step.id].text}
                  </span>
                </span>
                {step.id !== 'description' && (
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    Em breve
                  </span>
                )}
              </div>
              {step.id === 'description' && <DescriptionEditor />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DescriptionEditor() {
  const { store, setStore } = usePanel();
  const [bio, setBio] = useState(store?.bio ?? '');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (!store) return null;

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      const { data, error } = await storesUpdate({
        client: panelApi,
        path: { id: store!.id },
        body: { bio },
      });
      if (!data) {
        setMessage(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      setStore(data);
      await refreshStorefront(data.handle);
      setMessage('Salvo! Já aparece na sua loja.');
    } catch {
      setMessage('Sem conexão com a internet? Tente de novo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:pl-12">
      <textarea
        value={bio}
        onChange={(event) => {
          setBio(event.target.value);
          setMessage(null);
        }}
        rows={3}
        maxLength={300}
        placeholder="Ex.: Bolos caseiros feitos sob encomenda em Curitiba. Entrega e retirada."
        aria-label="Descrição da loja"
        className="w-full resize-none rounded-2xl border bg-background px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-foreground/40"
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={pending || bio.trim() === (store.bio ?? '')}
          onClick={() => void save()}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : 'Salvar'}
        </Button>
        <span className="text-xs text-muted-foreground">{bio.length}/300</span>
        {message && (
          <span role="status" className="text-sm text-muted-foreground">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
