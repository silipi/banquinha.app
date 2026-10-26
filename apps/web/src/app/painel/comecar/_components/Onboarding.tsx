'use client';

import {
  storesCheckHandle,
  storesCreate,
  themesList,
  type MeDto,
  type StoreSummaryDto,
  type ThemeDto,
} from '@banquinha/api-client';
import { ArrowLeft, Check, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { PRICE_TYPES_BY_KIND, type ItemKind } from '@/lib/item-price';
import {
  clearDraft,
  readDraft,
  saveDraft,
  type DraftProduct,
  type OnboardingDraft,
  type Offering,
} from '@/lib/onboarding-draft';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { formatStoreHandleInput } from '@/lib/store-handle-input';
import { themeStyle } from '@/lib/store-theme';
import { brandDomain } from '@/lib/site';
import { cn } from '@/lib/utils';
import { formatWhatsappInput, isCompleteWhatsapp } from '@/lib/whatsapp-input';
import { NETWORK_ERROR } from '../../_components/auth-shared';
import { Field, FormError } from '../../_components/fields';
import {
  PricingFields,
  priceForApi,
  pricingError,
} from '../../_components/PricingFields';
import { Published } from './Published';
import { StorePreview } from './StorePreview';

const STEPS = ['Sua loja', 'Tema', 'Produtos'] as const;

type Errors = Record<string, string | undefined>;

interface HandleCheck {
  status: 'idle' | 'checking' | 'ok' | 'error';
  message?: string;
  suggestions?: string[];
}

const kindFor = (offering: Offering): ItemKind =>
  offering === 'services' ? 'service' : 'product';

const newProduct = (kind: ItemKind): DraftProduct => ({
  key: crypto.randomUUID(),
  name: '',
  kind,
  priceType: 'fixed',
  priceCents: 0,
  description: '',
});

/** Wording of the products step for each answer to "what do you offer?". */
const OFFERING_COPY: Record<
  Offering,
  { title: string; item: string; add: string }
> = {
  products: {
    title: 'O que você vende?',
    item: 'Produto',
    add: 'Adicionar outro produto',
  },
  services: {
    title: 'Quais serviços você oferece?',
    item: 'Serviço',
    add: 'Adicionar outro serviço',
  },
  both: {
    title: 'O que você oferece?',
    item: 'Item',
    add: 'Adicionar outro item',
  },
};

const OFFERINGS: { value: Offering; label: string }[] = [
  { value: 'products', label: 'Produtos' },
  { value: 'services', label: 'Serviços' },
  { value: 'both', label: 'Os dois' },
];

// Portuguese connectors stay lowercase in names ("Flores da Maria").
const LOWERCASE_WORDS = new Set([
  'a',
  'as',
  'o',
  'os',
  'e',
  'da',
  'das',
  'de',
  'do',
  'dos',
]);

/** "flores-da-maria" → "Flores da Maria", a starting point the merchant can edit. */
function nameFromHandle(handle: string) {
  return handle
    .split('-')
    .filter(Boolean)
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

const handleFromName = (name: string) =>
  formatStoreHandleInput(name).replace(/-+$/, '');

function initialDraft(me: MeDto): OnboardingDraft {
  const saved = readDraft();
  const handle = saved.handle ?? '';
  const offering = saved.offering ?? 'products';
  // Drafts saved before services existed have no kind or price type.
  const products = saved.products?.map((product) => ({
    ...product,
    kind: product.kind ?? 'product',
    priceType: product.priceType ?? 'fixed',
  }));
  return {
    step: saved.step ?? 0,
    handle,
    handleEdited: saved.handleEdited ?? Boolean(handle),
    name: saved.name ?? nameFromHandle(handle),
    whatsapp:
      saved.whatsapp ?? formatWhatsappInput(me.whatsapp?.slice(2) ?? ''),
    // Set to the first platform theme (the default) once the themes load.
    themeId: saved.themeId ?? '',
    offering,
    products: products?.length ? products : [newProduct(kindFor(offering))],
  };
}

/**
 * Store creation right after sign-up: name and address → theme → products (at least
 * one) → live. One topic per screen, a live preview beside it and a draft saved in the
 * browser so leaving and coming back resumes the same step.
 */
export function Onboarding({ me }: { me: MeDto }) {
  const [draft, setDraft] = useState(() => initialDraft(me));
  const [themes, setThemes] = useState<ThemeDto[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [handleCheck, setHandleCheck] = useState<HandleCheck>({
    status: 'idle',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [published, setPublished] = useState<StoreSummaryDto | null>(null);

  useEffect(() => {
    themesList({ client: panelApi })
      .then(({ data }) => {
        if (!data?.length) return;
        setThemes(data);
        // Default theme already chosen; also replaces a saved one that no longer exists.
        setDraft((d) =>
          data.some((t) => t.id === d.themeId)
            ? d
            : { ...d, themeId: data[0]!.id },
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!published) saveDraft(draft);
  }, [draft, published]);

  const update = (changes: Partial<OnboardingDraft>) =>
    setDraft((d) => ({ ...d, ...changes }));

  const themeTokens = themes.find((t) => t.id === draft.themeId)?.tokens;

  async function checkHandle(handle = draft.handle): Promise<boolean> {
    if (!handle) {
      setHandleCheck({
        status: 'error',
        message: 'Escolha o endereço da loja',
      });
      return false;
    }
    setHandleCheck({ status: 'checking' });
    try {
      const { data } = await storesCheckHandle({
        client: panelApi,
        query: { handle },
      });
      if (!data) throw new Error('No response');
      if (data.handle !== handle) update({ handle: data.handle });
      setHandleCheck(
        data.available
          ? { status: 'ok' }
          : {
              status: 'error',
              message: data.message,
              suggestions: data.suggestions,
            },
      );
      return data.available;
    } catch {
      setHandleCheck({ status: 'error', message: NETWORK_ERROR });
      return false;
    }
  }

  async function validateStep(): Promise<boolean> {
    const found: Errors = {};
    if (draft.step === 0) {
      if (draft.name.trim().length < 2) found.name = 'Dê um nome à sua loja';
      if (!isCompleteWhatsapp(draft.whatsapp)) {
        found.whatsapp = 'Confira o WhatsApp: use o DDD e o número do celular';
      }
      setErrors(found);
      const handleOk = await checkHandle();
      return handleOk && !found.name && !found.whatsapp;
    }
    if (draft.step === 2) {
      draft.products.forEach((product) => {
        if (product.name.trim().length < 2) {
          found[`${product.key}.name`] = 'Dê um nome';
        }
        const priceError = pricingError(product);
        if (priceError) found[`${product.key}.price`] = priceError;
      });
      setErrors(found);
    }
    return Object.keys(found).length === 0;
  }

  async function next() {
    setFormError(null);
    if (!(await validateStep())) return;
    if (draft.step < STEPS.length - 1) {
      update({ step: draft.step + 1 });
      window.scrollTo({ top: 0 });
      return;
    }
    await publish();
  }

  async function publish() {
    setPending(true);
    try {
      const { data, error, response } = await storesCreate({
        client: panelApi,
        body: {
          handle: draft.handle,
          name: draft.name,
          whatsapp: draft.whatsapp,
          themeId: draft.themeId || undefined,
          // Someone who only offers services usually goes to the customer.
          ...(draft.offering === 'services'
            ? { pickupEnabled: false, deliveryEnabled: true }
            : {}),
          products: draft.products.map((product) => ({
            name: product.name,
            kind: product.kind,
            priceType: product.priceType,
            priceCents: priceForApi(product),
            description: product.description.trim() || undefined,
          })),
        },
      });
      if (response?.status === 409) {
        // Someone took the address meanwhile: back to it, with suggestions.
        update({ step: 0 });
        await checkHandle();
        return;
      }
      if (!data) {
        setFormError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      clearDraft();
      setPublished(data);
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  if (published) return <Published store={published} />;

  const isLast = draft.step === STEPS.length - 1;
  const maxProducts = me.plan.maxProducts;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 pt-5">
        <Logo />
        <Progress step={draft.step} />
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 pt-8 pb-32 md:grid-cols-[1fr_320px]">
        <section className="flex min-w-0 flex-col gap-6">
          {draft.step === 0 && (
            <StoreStep
              draft={draft}
              errors={errors}
              handleCheck={handleCheck}
              onChange={(changes) => {
                update(changes);
                setErrors({});
                if ('handle' in changes) setHandleCheck({ status: 'idle' });
              }}
              onHandleBlur={() => draft.handle && void checkHandle()}
              onPickSuggestion={(handle) => {
                update({ handle, handleEdited: true });
                void checkHandle(handle);
              }}
            />
          )}
          {draft.step === 1 && (
            <ThemeStep
              themes={themes}
              selected={draft.themeId}
              onSelect={(themeId) => update({ themeId })}
            />
          )}
          {draft.step === 2 && (
            <ProductsStep
              offering={draft.offering}
              products={draft.products}
              errors={errors}
              maxProducts={maxProducts}
              planName={me.plan.name}
              onOfferingChange={(offering) => {
                // Products or services only: every item follows the answer.
                const kind = offering === 'both' ? null : kindFor(offering);
                update({
                  offering,
                  products: draft.products.map((product) =>
                    kind && product.kind !== kind
                      ? {
                          ...product,
                          kind,
                          priceType: PRICE_TYPES_BY_KIND[kind].includes(
                            product.priceType,
                          )
                            ? product.priceType
                            : 'fixed',
                        }
                      : product,
                  ),
                });
                setErrors({});
              }}
              onChange={(products) => {
                update({ products });
                setErrors({});
              }}
            />
          )}
          <FormError>{formError}</FormError>
        </section>

        <aside className="md:sticky md:top-8 md:self-start">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Prévia da sua loja
          </p>
          <StorePreview
            name={draft.name}
            handle={draft.handle}
            theme={themeTokens}
            products={draft.products}
          />
        </aside>
      </main>

      {/* Main action stays within thumb reach, above the keyboard. */}
      <footer className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          {draft.step > 0 && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => update({ step: draft.step - 1 })}
              aria-label="Voltar"
            >
              <ArrowLeft />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 md:ml-auto md:flex-none md:px-10"
            disabled={pending || handleCheck.status === 'checking'}
            onClick={() => void next()}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" />
            ) : isLast ? (
              'Publicar minha loja'
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

/** The account counts as a step already done, so the bar never starts empty. */
function Progress({ step }: { step: number }) {
  const segments = ['Conta', ...STEPS];
  return (
    <div className="mt-5">
      <p className="text-sm text-muted-foreground">
        Passo {step + 1} de {STEPS.length} ·{' '}
        <span className="font-medium text-foreground">{STEPS[step]}</span>
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {segments.map((label, index) => (
          <span
            key={label}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-muted transition-colors',
              index <= step && 'bg-brand',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function StepHeading({ title, text }: { title: string; text: string }) {
  return (
    <header>
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
        {title}
      </h1>
      <p className="mt-2 text-pretty text-muted-foreground">{text}</p>
    </header>
  );
}

function StoreStep({
  draft,
  errors,
  handleCheck,
  onChange,
  onHandleBlur,
  onPickSuggestion,
}: {
  draft: OnboardingDraft;
  errors: Errors;
  handleCheck: HandleCheck;
  onChange: (changes: Partial<OnboardingDraft>) => void;
  onHandleBlur: () => void;
  onPickSuggestion: (handle: string) => void;
}) {
  const handleId = useId();
  return (
    <>
      <StepHeading
        title="Como sua loja se chama?"
        text="É o nome que seus clientes vão ver. Dá para mudar depois."
      />
      <Field
        label="Nome da loja"
        value={draft.name}
        error={errors.name}
        autoFocus
        autoCapitalize="words"
        enterKeyHint="next"
        placeholder="Ex.: Doces da Ana"
        onChange={(event) => {
          const name = event.target.value;
          onChange(
            draft.handleEdited
              ? { name }
              : { name, handle: handleFromName(name) },
          );
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={handleId} className="text-sm font-medium">
          Endereço da loja
        </label>
        <div
          className={cn(
            'flex h-13 items-center rounded-2xl border bg-surface px-4 transition-colors focus-within:border-foreground/40',
            handleCheck.status === 'error' && 'border-red-400',
          )}
        >
          <span className="shrink-0 text-muted-foreground">{brandDomain}/</span>
          <input
            id={handleId}
            value={draft.handle}
            onChange={(event) =>
              onChange({
                handle: formatStoreHandleInput(event.target.value),
                handleEdited: true,
              })
            }
            onBlur={onHandleBlur}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="sualoja"
            aria-invalid={handleCheck.status === 'error'}
            className="h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/60"
          />
          {handleCheck.status === 'checking' && (
            <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
          )}
          {handleCheck.status === 'ok' && (
            <Check className="size-5 text-green-600" aria-label="Disponível" />
          )}
        </div>
        {handleCheck.status === 'error' ? (
          <div role="alert" className="text-sm text-red-600">
            {handleCheck.message}
            {handleCheck.suggestions && handleCheck.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-foreground">
                <span className="text-muted-foreground">Livres:</span>
                {handleCheck.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onPickSuggestion(suggestion)}
                    className="rounded-full border bg-surface px-3 py-1 text-sm hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            É o link que você vai colocar na bio e mandar no WhatsApp.
          </p>
        )}
      </div>

      <Field
        label="WhatsApp para receber os pedidos"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={draft.whatsapp}
        error={errors.whatsapp}
        placeholder="(41) 99999-9999"
        hint="Os pedidos da loja chegam prontos nesse número."
        onChange={(event) =>
          onChange({ whatsapp: formatWhatsappInput(event.target.value) })
        }
      />
    </>
  );
}

function ThemeStep({
  themes,
  selected,
  onSelect,
}: {
  themes: ThemeDto[];
  selected: string;
  onSelect: (themeId: string) => void;
}) {
  return (
    <>
      <StepHeading
        title="Escolha o visual"
        text="Já deixamos um escolhido. Toque em outro para ver como fica na prévia."
      />
      {themes.length === 0 ? (
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <div role="radiogroup" aria-label="Tema da loja" className="grid gap-3">
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
                  'flex items-center gap-4 rounded-3xl border bg-surface p-3 text-left transition-colors hover:bg-muted/60',
                  active && 'border-foreground ring-2 ring-foreground',
                )}
              >
                {/* Swatch drawn from the theme's own tokens, so any theme gets one. */}
                <span
                  className="storefront flex size-16 shrink-0 items-end justify-center gap-1 rounded-2xl border bg-background p-2"
                  style={themeStyle(theme.tokens)}
                  aria-hidden
                >
                  <span className="h-6 w-4 rounded-md bg-store" />
                  <span className="h-8 w-4 rounded-md bg-muted" />
                  <span className="h-5 w-4 rounded-md border bg-surface" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{theme.name}</span>
                  <span className="block text-sm text-pretty text-muted-foreground">
                    {theme.description}
                  </span>
                </span>
                {active && <Check className="mr-2 size-5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function ProductsStep({
  offering,
  products,
  errors,
  maxProducts,
  planName,
  onOfferingChange,
  onChange,
}: {
  offering: Offering;
  products: DraftProduct[];
  errors: Errors;
  maxProducts: number;
  planName: string;
  onOfferingChange: (offering: Offering) => void;
  onChange: (products: DraftProduct[]) => void;
}) {
  const edit = (key: string, changes: Partial<DraftProduct>) =>
    onChange(products.map((p) => (p.key === key ? { ...p, ...changes } : p)));
  const copy = OFFERING_COPY[offering];

  return (
    <>
      <StepHeading
        title={copy.title}
        text="Cadastre pelo menos um item para a loja ir ao ar. As fotos você coloca depois, no painel."
      />
      <div
        role="radiogroup"
        aria-label="O que você oferece"
        className="grid grid-cols-3 gap-1 rounded-full border bg-muted/60 p-1"
      >
        {OFFERINGS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={offering === value}
            onClick={() => onOfferingChange(value)}
            className="h-11 rounded-full text-sm font-medium transition-colors aria-checked:bg-surface aria-checked:shadow-sm"
          >
            {label}
          </button>
        ))}
      </div>
      {products.map((product, index) => (
        <ProductCard
          key={product.key}
          index={index}
          label={copy.item}
          showKind={offering === 'both'}
          product={product}
          errors={errors}
          canRemove={products.length > 1}
          onEdit={(changes) => edit(product.key, changes)}
          onRemove={() =>
            onChange(products.filter((p) => p.key !== product.key))
          }
        />
      ))}
      <div className="flex flex-col items-start gap-1">
        <Button
          variant="outline"
          disabled={products.length >= maxProducts}
          onClick={() => onChange([...products, newProduct(kindFor(offering))])}
        >
          <Plus /> {copy.add}
        </Button>
        <p className="text-sm text-muted-foreground">
          {products.length} de {maxProducts} itens no plano {planName}.
        </p>
      </div>
    </>
  );
}

function ProductCard({
  index,
  label,
  showKind,
  product,
  errors,
  canRemove,
  onEdit,
  onRemove,
}: {
  index: number;
  /** "Produto", "Serviço" or "Item". */
  label: string;
  /** Asks product or service, for stores that offer both. */
  showKind: boolean;
  product: DraftProduct;
  errors: Errors;
  canRemove: boolean;
  onEdit: (changes: Partial<DraftProduct>) => void;
  onRemove: () => void;
}) {
  const descriptionId = useId();
  const service = product.kind === 'service';

  return (
    <fieldset className="flex flex-col gap-4 rounded-3xl border bg-surface/60 p-4">
      <legend className="sr-only">
        {label} {index + 1}
      </legend>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {label} {index + 1}
        </span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Remover ${label.toLowerCase()} ${index + 1}`}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      <Field
        label="Nome"
        value={product.name}
        error={errors[`${product.key}.name`]}
        autoFocus={index > 0}
        autoCapitalize="sentences"
        placeholder={
          service
            ? 'Ex.: Formatação de computador'
            : 'Ex.: Bolo de pote de chocolate'
        }
        onChange={(event) => onEdit({ name: event.target.value })}
      />
      <PricingFields
        value={product}
        error={errors[`${product.key}.price`]}
        showKind={showKind}
        onChange={onEdit}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={descriptionId} className="text-sm font-medium">
          Descrição{' '}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id={descriptionId}
          value={product.description}
          rows={2}
          maxLength={500}
          placeholder={
            service
              ? 'O que está incluso, quanto tempo leva…'
              : 'Tamanho, sabor, material…'
          }
          onChange={(event) => onEdit({ description: event.target.value })}
          className="w-full resize-none rounded-2xl border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-foreground/40"
        />
      </div>
    </fieldset>
  );
}
