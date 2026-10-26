'use client';

import type { StoreFieldDto } from '@banquinha/api-client';
import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import type { FieldDraft } from '@/lib/field-input';
import { cn } from '@/lib/utils';

const control =
  'h-13 w-full rounded-2xl border bg-surface px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40 aria-invalid:border-red-400';

/** One input per custom field of the store, all optional. */
export function FieldInputs({
  fields,
  value,
  onChange,
}: {
  fields: StoreFieldDto[];
  value: FieldDraft;
  onChange: (value: FieldDraft) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 text-sm font-medium">
        Informações extras{' '}
        <span className="font-normal text-muted-foreground">(opcionais)</span>
      </legend>
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={value[field.id] ?? ''}
          onChange={(text) => onChange({ ...value, [field.id]: text })}
        />
      ))}
    </fieldset>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: StoreFieldDto;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const options =
    field.type === 'boolean'
      ? [
          { value: 'true', label: 'Sim' },
          { value: 'false', label: 'Não' },
        ]
      : (field.options ?? []).map((option) => ({
          value: option,
          label: option,
        }));
  // An option taken out of the field since shows as not filled in.
  const selectValue = options.some((o) => o.value === value) ? value : '';

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {field.label}
      </label>
      {field.type === 'choice' || field.type === 'boolean' ? (
        <div className="relative">
          <select
            id={id}
            value={selectValue}
            onChange={(event) => onChange(event.target.value)}
            className={cn(control, 'appearance-none pr-10')}
          >
            <option value="">Não informado</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      ) : (
        <div className="relative">
          <input
            id={id}
            value={value}
            {...(field.type === 'number'
              ? {
                  type: 'number',
                  inputMode: 'decimal',
                  step: 'any',
                  // Letters an <input type="number"> still lets through (1e5, +1).
                  onKeyDown: (event: React.KeyboardEvent) => {
                    if (['e', 'E', '+'].includes(event.key)) {
                      event.preventDefault();
                    }
                  },
                  // A scroll over a focused number input would change it.
                  onWheel: (event: React.WheelEvent<HTMLInputElement>) =>
                    event.currentTarget.blur(),
                }
              : { maxLength: 80 })}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              control,
              '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              field.unit && 'pr-16',
            )}
          />
          {field.unit && (
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground">
              {field.unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
