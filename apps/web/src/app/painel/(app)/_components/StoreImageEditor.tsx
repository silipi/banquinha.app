'use client';

import {
  storesRemoveImage,
  storesUploadImage,
  type StoreDashboardDto,
} from '@banquinha/api-client';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { shrinkImage } from '@/lib/shrink-image';
import { cn } from '@/lib/utils';
import { refreshStorefront } from '../../actions';
import { usePanel } from './panel-context';

type Slot = 'logo' | 'banner';

// A bit above what the API stores (512px logo, 2048px banner), so it has room to crop.
const MAX_SIDE: Record<Slot, number> = { logo: 1024, banner: 2400 };
// Same limit as the API; only reached when the browser can't shrink the file.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const COPY: Record<Slot, { choose: string; alt: string }> = {
  logo: { choose: 'Escolher logo', alt: 'Logo da loja' },
  banner: { choose: 'Escolher banner', alt: 'Banner da loja' },
};

/** Upload, replace or remove the store's logo or banner, right from the checklist. */
export function StoreImageEditor({ slot }: { slot: Slot }) {
  const { store, setStore } = usePanel();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<'upload' | 'remove' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!store) return null;

  const url = slot === 'logo' ? store.logoUrl : store.bannerUrl;

  async function run(
    action: 'upload' | 'remove',
    request: () => Promise<{ data?: StoreDashboardDto; error?: unknown }>,
  ) {
    setPending(action);
    setMessage(null);
    try {
      const { data, error } = await request();
      if (!data) {
        setMessage(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      setStore(data);
      await refreshStorefront(data.handle);
      setMessage(
        action === 'upload'
          ? 'Pronto! Já aparece na sua loja.'
          : 'Removido da sua loja.',
      );
    } catch {
      setMessage('Sem conexão com a internet? Tente de novo.');
    } finally {
      setPending(null);
    }
  }

  async function upload(file: File) {
    const body = await shrinkImage(file, MAX_SIDE[slot]);
    if (body.size > MAX_UPLOAD_BYTES) {
      setMessage('Imagem muito grande. Envie uma de até 10 MB.');
      return;
    }
    await run('upload', () =>
      storesUploadImage({
        client: panelApi,
        path: { id: store!.id, slot },
        body: { file: body },
      }),
    );
  }

  const choose = () => input.current?.click();

  return (
    <div className="flex flex-col gap-3 sm:pl-12">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void upload(file);
        }}
      />

      <button
        type="button"
        onClick={choose}
        disabled={pending !== null}
        aria-label={
          url ? `Trocar ${COPY[slot].alt.toLowerCase()}` : COPY[slot].choose
        }
        className={cn(
          'relative flex items-center justify-center overflow-hidden border bg-background text-muted-foreground transition-colors hover:border-foreground/40 disabled:opacity-60',
          slot === 'logo'
            ? 'size-20 rounded-full'
            : 'aspect-[3/1] w-full max-w-sm rounded-2xl',
          !url && 'border-dashed',
        )}
      >
        {url ? (
          <Image
            src={url}
            alt={COPY[slot].alt}
            fill
            sizes={slot === 'logo' ? '80px' : '384px'}
            className="object-cover"
          />
        ) : (
          <ImagePlus className="size-6" />
        )}
        {pending === 'upload' && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <LoaderCircle className="size-6 animate-spin text-foreground" />
          </span>
        )}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={pending !== null} onClick={choose}>
          {url ? 'Trocar' : COPY[slot].choose}
        </Button>
        {url && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending !== null}
            onClick={() =>
              void run('remove', () =>
                storesRemoveImage({
                  client: panelApi,
                  path: { id: store.id, slot },
                }),
              )
            }
          >
            {pending === 'remove' ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Trash2 />
            )}
            Remover
          </Button>
        )}
        {message && (
          <span role="status" className="text-sm text-muted-foreground">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
