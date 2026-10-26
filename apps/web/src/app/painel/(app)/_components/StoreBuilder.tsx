'use client';

import {
  storesRemoveImage,
  storesUpdate,
  storesUploadImage,
  themesList,
  type StoreDashboardDto,
  type ThemeDto,
  type ThemeTokensDto,
} from '@banquinha/api-client';
import {
  Camera,
  Check,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { contrastRatio, readableTextOn } from '@/lib/contrast';
import { shrinkImage } from '@/lib/shrink-image';
import { themeStyle } from '@/lib/store-theme';
import { storeDisplayUrl } from '@/lib/storefront-links';
import { cn } from '@/lib/utils';
import { refreshStorefront } from '../../actions';
import { usePanel } from './panel-context';

type Slot = 'logo' | 'banner';

/** A picked image waiting to be published, or the published one marked for removal. */
type ImageChange = { file: Blob; previewUrl: string } | 'removed';

interface Draft {
  logo?: ImageChange;
  banner?: ImageChange;
  bio?: string;
  themeId?: string;
  /** Null: back to the theme's color. */
  accentColor?: string | null;
}

// A bit above what the API stores (512px logo, 2048px banner), so it has room to crop.
const MAX_SIDE: Record<Slot, number> = { logo: 1024, banner: 2400 };
// Same limit as the API; only reached when the browser can't shrink the file.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const BIO_MAX = 300;
const OPEN_KEY = 'banquinha:builder-open';

const without = (draft: Draft, ...fields: (keyof Draft)[]): Draft => {
  const next = { ...draft };
  for (const field of fields) delete next[field];
  return next;
};

/**
 * The store's look, edited on a live copy of the storefront: logo, banner,
 * description, theme and accent color. Changes stay in a draft until "Publicar".
 * Always on the dashboard, so it works for the first setup and for later tweaks;
 * items still missing get a badge.
 */
export function StoreBuilder() {
  const { store, setStore } = usePanel();
  const [open, setOpen] = useState(true);
  const [themes, setThemes] = useState<ThemeDto[]>([]);
  const [draft, setDraft] = useState<Draft>({});
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(OPEN_KEY) === 'false') setOpen(false);
    } catch {}
    // The sidebar's "complete your store" link points here.
    const openOnHash = () => {
      if (window.location.hash === '#personalizar') setOpen(true);
    };
    openOnHash();
    window.addEventListener('hashchange', openOnHash);
    return () => window.removeEventListener('hashchange', openOnHash);
  }, []);

  useEffect(() => {
    themesList({ client: panelApi })
      .then(({ data }) => data && setThemes(data))
      .catch(() => {});
  }, []);

  const dirty = Object.keys(draft).length > 0;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!store) return null;

  const imageUrl = (slot: Slot) => {
    const change = draft[slot];
    if (change === 'removed') return null;
    return (
      change?.previewUrl ?? (slot === 'logo' ? store.logoUrl : store.bannerUrl)
    );
  };
  const bio = draft.bio ?? store.bio ?? '';
  const themeId = draft.themeId ?? store.themeId;
  // The store's own tokens include its overrides; other themes show as they come.
  const accentColor =
    draft.accentColor !== undefined ? draft.accentColor : store.accentColor;
  // Until the themes load, the store's own resolved tokens stand in.
  const themeTokens =
    themes.find((t) => t.id === themeId)?.tokens ?? store.theme;
  const theme: ThemeTokensDto = accentColor
    ? {
        ...themeTokens,
        colors: {
          ...themeTokens.colors,
          accent: accentColor,
          accentForeground: readableTextOn(accentColor),
        },
      }
    : themeTokens;

  const missing = {
    logo: !imageUrl('logo'),
    banner: !imageUrl('banner'),
    description: !bio.trim(),
  };
  const done = store.setup.filter((step) => step.done).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, String(next));
    } catch {}
  }

  function change(changes: Draft) {
    setMessage(null);
    setDraft((current) => {
      const next = { ...current, ...changes };
      // Back to the published value: nothing to publish for that field.
      if (next.bio !== undefined && next.bio.trim() === (store!.bio ?? '')) {
        delete next.bio;
      }
      if (next.themeId === store!.themeId) delete next.themeId;
      if (next.accentColor === store!.accentColor) delete next.accentColor;
      for (const slot of ['logo', 'banner'] as const) {
        const previous = current[slot];
        if (previous && previous !== 'removed' && previous !== next[slot]) {
          URL.revokeObjectURL(previous.previewUrl);
        }
      }
      return next;
    });
  }

  async function pickImage(slot: Slot, file: File) {
    const shrunk = await shrinkImage(file, MAX_SIDE[slot]);
    if (shrunk.size > MAX_UPLOAD_BYTES) {
      setMessage('Imagem muito grande. Envie uma de até 10 MB.');
      return;
    }
    change({
      [slot]: { file: shrunk, previewUrl: URL.createObjectURL(shrunk) },
    });
  }

  function removeImage(slot: Slot) {
    const published = slot === 'logo' ? store!.logoUrl : store!.bannerUrl;
    // Removing a picture that was never published just drops it from the draft.
    if (published) {
      change({ [slot]: 'removed' });
    } else {
      setDraft((current) => {
        const { [slot]: dropped, ...rest } = current;
        if (dropped && dropped !== 'removed') {
          URL.revokeObjectURL(dropped.previewUrl);
        }
        return rest;
      });
    }
  }

  function discard() {
    for (const slot of ['logo', 'banner'] as const) {
      const pending = draft[slot];
      if (pending && pending !== 'removed')
        URL.revokeObjectURL(pending.previewUrl);
    }
    setDraft({});
    setMessage(null);
  }

  /** Sends each change in turn; what was saved leaves the draft even if a later step fails. */
  async function publish() {
    setPublishing(true);
    setMessage(null);
    let latest: StoreDashboardDto | undefined;
    const settle = (field: keyof Draft, data: StoreDashboardDto) => {
      latest = data;
      setStore(data);
      setDraft((current) => without(current, field));
    };

    try {
      for (const slot of ['logo', 'banner'] as const) {
        const pending = draft[slot];
        if (!pending) continue;
        const { data, error } =
          pending === 'removed'
            ? await storesRemoveImage({
                client: panelApi,
                path: { id: store!.id, slot },
              })
            : await storesUploadImage({
                client: panelApi,
                path: { id: store!.id, slot },
                body: { file: pending.file },
              });
        if (!data) {
          setMessage(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
          return;
        }
        if (pending !== 'removed') URL.revokeObjectURL(pending.previewUrl);
        settle(slot, data);
      }

      if (
        draft.bio !== undefined ||
        draft.themeId !== undefined ||
        draft.accentColor !== undefined
      ) {
        const { data, error } = await storesUpdate({
          client: panelApi,
          path: { id: store!.id },
          body: {
            bio: draft.bio,
            themeId: draft.themeId,
            accentColor: draft.accentColor,
          },
        });
        if (!data) {
          setMessage(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
          return;
        }
        latest = data;
        setStore(data);
        setDraft((current) =>
          without(current, 'bio', 'themeId', 'accentColor'),
        );
      }
      setMessage('Publicado! Sua loja já está atualizada.');
    } catch {
      setMessage('Sem conexão com a internet? Tente de novo.');
    } finally {
      if (latest) await refreshStorefront(latest.handle).catch(() => {});
      setPublishing(false);
    }
  }

  const pendingCount = Object.values(missing).filter(Boolean).length;

  return (
    <section
      id="personalizar"
      className="scroll-mt-8 overflow-hidden rounded-3xl border bg-surface"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="store-builder"
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-display text-xl font-bold">
            Sua vitrine
            {done === store.setup.length && (
              <span className="flex size-6 items-center justify-center rounded-full bg-sage">
                <Check className="size-3.5" />
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {done === store.setup.length
              ? 'Logo, banner, descrição, tema e cor. Mude quando quiser.'
              : `${done} de ${store.setup.length} itens prontos. Lojas completas passam mais confiança.`}
          </span>
        </span>
        {dirty && !open && (
          <span className="shrink-0 rounded-full bg-butter px-2.5 py-1 text-xs font-medium">
            Não publicado
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div id="store-builder" className="relative border-t">
          {publishing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface/70 text-sm font-medium backdrop-blur-[2px]">
              <LoaderCircle className="size-7 animate-spin" />
              Publicando sua vitrine…
            </div>
          )}
          <div
            inert={publishing}
            aria-busy={publishing}
            className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_16rem]"
          >
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Toque no que quiser mudar.{' '}
                {pendingCount > 0 && (
                  <>
                    Os pontos{' '}
                    <Attention className="inline-flex align-text-bottom" />{' '}
                    mostram o que ainda falta.
                  </>
                )}
              </p>
              <StorePreview
                handle={store.handle}
                name={store.name}
                theme={theme}
                logoUrl={imageUrl('logo')}
                bannerUrl={imageUrl('banner')}
                bio={bio}
                missing={missing}
                onPick={(slot, file) => void pickImage(slot, file)}
                onRemove={removeImage}
                onBioChange={(value) => change({ bio: value })}
              />
            </div>

            <div className="flex flex-col gap-6">
              <ThemePicker
                themes={themes}
                selected={themeId}
                onSelect={(id) => change({ themeId: id })}
              />
              <AccentPicker
                themeAccent={themeTokens.colors.accent}
                background={themeTokens.colors.background}
                selected={accentColor}
                onSelect={(color) => change({ accentColor: color })}
              />
            </div>
          </div>

          <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t bg-surface/95 px-5 py-4 backdrop-blur">
            <span
              role="status"
              className="min-w-0 flex-1 text-sm text-muted-foreground"
            >
              {message ??
                (dirty
                  ? 'Você tem alterações que ainda não estão na loja.'
                  : 'Tudo publicado.')}
            </span>
            {dirty && (
              <Button
                size="sm"
                variant="ghost"
                disabled={publishing}
                onClick={discard}
              >
                Descartar
              </Button>
            )}
            <Button
              variant="brand"
              disabled={!dirty || publishing}
              onClick={() => void publish()}
            >
              {publishing && <LoaderCircle className="animate-spin" />}
              Publicar
            </Button>
          </footer>
        </div>
      )}
    </section>
  );
}

/** The "still missing" mark on parts of the preview. */
function Attention({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-4 items-center justify-center rounded-full border border-ink/15 bg-butter text-[10px] leading-none font-bold text-ink',
        className ?? 'flex',
      )}
    >
      !
    </span>
  );
}

function StorePreview({
  handle,
  name,
  theme,
  logoUrl,
  bannerUrl,
  bio,
  missing,
  onPick,
  onRemove,
  onBioChange,
}: {
  handle: string;
  name: string;
  theme: ThemeTokensDto;
  logoUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  missing: Record<Slot | 'description', boolean>;
  onPick: (slot: Slot, file: File) => void;
  onRemove: (slot: Slot) => void;
  onBioChange: (bio: string) => void;
}) {
  return (
    <div
      className="storefront overflow-hidden rounded-[2rem] border bg-background text-foreground shadow-sm"
      style={themeStyle(theme)}
      aria-label="Prévia editável da sua loja"
    >
      <div className="border-b bg-surface/60 px-4 py-2 text-center text-xs text-muted-foreground">
        {storeDisplayUrl(handle)}
      </div>

      <div className="flex flex-col items-center px-4 pt-4 pb-6 text-center sm:px-6">
        <ImageSlot
          slot="banner"
          url={bannerUrl}
          label="banner"
          missing={missing.banner}
          onPick={onPick}
          onRemove={onRemove}
          className="aspect-[2/1] w-full rounded-store sm:aspect-[3/1]"
          empty={
            // Raised so the logo overlapping the bottom edge doesn't cover it.
            <span className="flex items-center gap-2 pb-10 text-sm font-medium">
              <ImagePlus className="size-5" /> Adicionar banner
            </span>
          }
        />

        <ImageSlot
          slot="logo"
          url={logoUrl}
          label="logo"
          missing={missing.logo}
          onPick={onPick}
          onRemove={onRemove}
          round
          className="-mt-10 size-20 rounded-full ring-4 ring-surface"
          empty={
            <span className="font-display text-3xl font-bold text-store">
              {name.charAt(0).toUpperCase()}
            </span>
          }
        />

        <p className="mt-3 font-display text-2xl font-bold tracking-tight text-balance">
          {name}
        </p>

        <div className="relative mt-2 w-full max-w-md">
          <textarea
            value={bio}
            onChange={(event) => onBioChange(event.target.value)}
            rows={2}
            maxLength={BIO_MAX}
            placeholder="Toque para escrever o que você vende. Ex.: Bolos caseiros sob encomenda em Curitiba."
            aria-label="Descrição da loja"
            // Always framed, so it reads as a field even after it's filled in.
            className="field-sizing-content min-h-12 w-full resize-none rounded-store-sm border border-dashed border-foreground/25 bg-surface/50 py-2 pr-8 pl-8 text-center text-sm text-pretty text-muted-foreground outline-none placeholder:text-muted-foreground/70 hover:border-foreground/40 focus:border-solid focus:border-foreground/40 focus:bg-surface"
          />
          {missing.description ? (
            <Attention className="absolute -top-1.5 -right-1.5 flex" />
          ) : (
            <Pencil
              aria-hidden
              className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-muted-foreground"
            />
          )}
          {bio.length > BIO_MAX - 60 && (
            <span className="text-xs text-muted-foreground">
              {bio.length}/{BIO_MAX}
            </span>
          )}
        </div>

        <span className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-store px-3 text-xs font-medium text-store-foreground">
          <MessageCircle className="size-3.5" /> WhatsApp
        </span>

        {/* Placeholder products: just enough to judge the look. */}
        <div
          className="mt-6 grid w-full grid-cols-3 gap-3 text-left"
          aria-hidden
        >
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="aspect-square rounded-store-sm bg-store-soft" />
              <div className="mt-2 h-2.5 w-3/4 rounded-full bg-muted" />
              <div className="mt-1.5 h-2.5 w-1/3 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageSlot({
  slot,
  url,
  label,
  missing,
  onPick,
  onRemove,
  round = false,
  className,
  empty,
}: {
  slot: Slot;
  url: string | null;
  label: string;
  missing: boolean;
  onPick: (slot: Slot, file: File) => void;
  onRemove: (slot: Slot) => void;
  round?: boolean;
  className: string;
  empty: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className={cn('group relative shrink-0', className)}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onPick(slot, file);
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={url ? `Trocar ${label}` : `Adicionar ${label}`}
        className={cn(
          'relative flex size-full items-center justify-center overflow-hidden bg-store-soft text-muted-foreground transition-[filter] hover:brightness-95',
          round ? 'rounded-full' : 'rounded-store',
          !url && 'border-2 border-dashed border-store/30',
        )}
      >
        {url ? (
          <>
            <Image
              src={url}
              alt=""
              fill
              sizes={
                slot === 'logo' ? '80px' : '(min-width: 1024px) 640px, 100vw'
              }
              unoptimized={url.startsWith('blob:')}
              className="object-cover"
            />
            <span
              className={cn(
                'absolute flex items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm',
                round ? 'bottom-1 size-6' : 'right-2 bottom-2 size-8',
              )}
            >
              <Camera className={round ? 'size-3.5' : 'size-4'} />
            </span>
          </>
        ) : (
          empty
        )}
      </button>
      {url && (
        <button
          type="button"
          onClick={() => onRemove(slot)}
          aria-label={`Remover ${label}`}
          className={cn(
            'absolute flex items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100',
            // On the logo it sits on the circle's edge so it doesn't cover the picture.
            round ? '-top-1 -right-1 size-7 border' : 'top-2 right-2 size-8',
          )}
        >
          <Trash2 className={round ? 'size-3.5' : 'size-4'} />
        </button>
      )}
      {missing && <Attention className="absolute -top-1 -right-1 flex" />}
    </div>
  );
}

function ThemePicker({
  themes,
  selected,
  onSelect,
}: {
  themes: ThemeDto[];
  selected: string;
  onSelect: (themeId: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">Tema</p>
      {themes.length === 0 ? (
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <div
          role="radiogroup"
          aria-label="Tema da loja"
          className="grid grid-cols-3 gap-2 lg:grid-cols-1"
        >
          {themes.map((theme) => {
            const active = theme.id === selected;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(theme.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border bg-background p-2 text-center text-sm transition-colors hover:bg-muted/60 lg:flex-row lg:text-left',
                  active && 'border-foreground ring-2 ring-foreground',
                )}
              >
                {/* Swatch drawn from the theme's own tokens, so any theme gets one. */}
                <span
                  className="storefront flex h-12 w-full shrink-0 items-end justify-center gap-1 rounded-xl border bg-background p-2 lg:w-12"
                  style={themeStyle(theme.tokens)}
                  aria-hidden
                >
                  <span className="h-5 w-3 rounded bg-store" />
                  <span className="h-7 w-3 rounded bg-muted" />
                  <span className="h-4 w-3 rounded border bg-surface" />
                </span>
                <span className="min-w-0 flex-1 font-medium">{theme.name}</span>
                {active && (
                  <Check className="hidden size-4 shrink-0 lg:block" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Strong, distinct colors that read well as buttons with white or dark text.
const ACCENT_PRESETS = [
  { color: '#ff5a1f', name: 'Laranja' },
  { color: '#e11d48', name: 'Vermelho' },
  { color: '#c2477a', name: 'Rosa' },
  { color: '#7c3aed', name: 'Roxo' },
  { color: '#2563eb', name: 'Azul' },
  { color: '#0f766e', name: 'Verde-água' },
  { color: '#4f7a3a', name: 'Verde' },
  { color: '#1a1714', name: 'Preto' },
];

function AccentPicker({
  themeAccent,
  background,
  selected,
  onSelect,
}: {
  themeAccent: string;
  background: string;
  /** Null when the theme's color is used. */
  selected: string | null;
  onSelect: (color: string | null) => void;
}) {
  const current = selected ?? themeAccent;
  const custom =
    selected !== null && !ACCENT_PRESETS.some((p) => p.color === selected);
  // Accent also colors text on the page background (initials, links).
  const lowContrast = contrastRatio(current, background) < 3;
  const swatch =
    'relative flex size-9 items-center justify-center rounded-full border-2 border-background ring-1 ring-border transition-transform hover:scale-105 aria-checked:ring-2 aria-checked:ring-foreground';

  return (
    <div>
      <p className="mb-3 text-sm font-medium">Cor dos botões</p>
      <div
        role="radiogroup"
        aria-label="Cor dos botões"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={selected === null}
          aria-label="Cor do tema"
          title="Cor do tema"
          onClick={() => onSelect(null)}
          className={cn(swatch, 'overflow-hidden')}
          style={{ background: themeAccent }}
        >
          <span className="absolute inset-x-0 bottom-0 bg-background/85 text-[8px] leading-3 font-bold">
            TEMA
          </span>
        </button>
        {ACCENT_PRESETS.filter(({ color }) => color !== themeAccent).map(
          ({ color, name }) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={selected === color}
              aria-label={name}
              title={name}
              onClick={() => onSelect(color)}
              className={swatch}
              style={{ background: color }}
            />
          ),
        )}
        <label
          title="Outra cor"
          className={cn(
            swatch,
            'cursor-pointer bg-[conic-gradient(#e11d48,#f59e0b,#16a34a,#2563eb,#7c3aed,#e11d48)]',
            custom && 'ring-2 ring-foreground',
          )}
          style={custom ? { background: selected } : undefined}
        >
          <input
            type="color"
            value={current}
            onChange={(event) => onSelect(event.target.value)}
            aria-label="Escolher outra cor"
            className="sr-only"
          />
        </label>
      </div>
      {lowContrast && (
        <p className="mt-2 text-xs text-muted-foreground">
          Cor bem clara: os botões ficam legíveis, mas textos nessa cor podem
          sumir no fundo da loja.
        </p>
      )}
    </div>
  );
}
