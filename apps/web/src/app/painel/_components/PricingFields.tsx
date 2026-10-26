'use client';

import { useId } from 'react';
import {
  PRICE_TYPE_LABELS,
  PRICE_TYPES_BY_KIND,
  type ItemKind,
  type PriceType,
} from '@/lib/item-price';
import { formatPriceInput, parsePriceInput } from '@/lib/price-input';
import { cn } from '@/lib/utils';

export interface PricingDraft {
  kind: ItemKind;
  priceType: PriceType;
  /** 0 while empty. Ignored for "quote". */
  priceCents: number;
}

const KIND_LABELS: Record<ItemKind, string> = {
  product: 'Produto',
  service: 'Serviço',
};

const PRICE_LABELS: Record<Exclude<PriceType, 'quote'>, string> = {
  fixed: 'Preço',
  hourly: 'Preço por hora',
  daily: 'Preço da diária',
  from: 'Preço inicial',
};

const PRICE_SUFFIXES: Partial<Record<PriceType, string>> = {
  hourly: '/hora',
  daily: '/diária',
};

/** The draft's price as the API takes it: null for "quote". */
export const priceForApi = (draft: PricingDraft) =>
  draft.priceType === 'quote' ? null : draft.priceCents;

/** Error for a missing price, mirroring the API. */
export const pricingError = (draft: PricingDraft) =>
  draft.priceType !== 'quote' && !draft.priceCents ? 'Informe o preço' : null;

const chip =
  'h-9 rounded-full border bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-muted aria-checked:border-ink aria-checked:bg-ink aria-checked:text-ink-foreground';

/**
 * Product or service, how it's charged (fixed, per hour, per day, "from" or on quote)
 * and the price, for the product editor and the onboarding.
 */
export function PricingFields({
  value,
  error,
  showKind = true,
  onChange,
}: {
  value: PricingDraft;
  error?: string | null;
  /** Off when the kind is already settled (an onboarding of only products or services). */
  showKind?: boolean;
  onChange: (changes: Partial<PricingDraft>) => void;
}) {
  const priceId = useId();
  const priceTypes = PRICE_TYPES_BY_KIND[value.kind];

  return (
    <div className="flex flex-col gap-4">
      {showKind && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">É um</span>
          <div
            role="radiogroup"
            aria-label="Tipo"
            className="grid grid-cols-2 gap-1 rounded-full border bg-muted/60 p-1"
          >
            {(['product', 'service'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={value.kind === kind}
                onClick={() =>
                  onChange({
                    kind,
                    // Per hour and per day are for services only.
                    ...(PRICE_TYPES_BY_KIND[kind].includes(value.priceType)
                      ? {}
                      : { priceType: 'fixed' }),
                  })
                }
                className="h-10 rounded-full text-sm font-medium transition-colors aria-checked:bg-surface aria-checked:shadow-sm"
              >
                {KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Como cobrar</span>
        <div
          role="radiogroup"
          aria-label="Como cobrar"
          className="flex flex-wrap gap-2"
        >
          {priceTypes.map((priceType) => (
            <button
              key={priceType}
              type="button"
              role="radio"
              aria-checked={value.priceType === priceType}
              onClick={() => onChange({ priceType })}
              className={chip}
            >
              {PRICE_TYPE_LABELS[priceType]}
            </button>
          ))}
        </div>
      </div>

      {value.priceType === 'quote' ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          Na loja aparece “Sob orçamento”: o cliente pede e vocês combinam o
          valor pelo WhatsApp.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={priceId} className="text-sm font-medium">
            {PRICE_LABELS[value.priceType]}
          </label>
          <div
            className={cn(
              'flex h-13 items-center gap-2 rounded-2xl border bg-surface px-4 focus-within:border-foreground/40',
              error && 'border-red-400',
            )}
          >
            <span className="text-muted-foreground">
              {value.priceType === 'from' ? 'a partir de R$' : 'R$'}
            </span>
            <input
              id={priceId}
              inputMode="numeric"
              value={formatPriceInput(value.priceCents)}
              placeholder="0,00"
              aria-invalid={Boolean(error)}
              onChange={(event) =>
                onChange({ priceCents: parsePriceInput(event.target.value) })
              }
              className="h-full min-w-0 flex-1 bg-transparent text-base font-medium tabular-nums outline-none placeholder:text-muted-foreground/60"
            />
            {PRICE_SUFFIXES[value.priceType] && (
              <span className="text-muted-foreground">
                {PRICE_SUFFIXES[value.priceType]}
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
