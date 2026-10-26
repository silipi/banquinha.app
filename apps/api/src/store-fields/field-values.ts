import { BadRequestException } from '@nestjs/common';

// Custom fields: a store defines them once (Ano, Km, Câmbio) and each item fills in its
// values, all optional. Values live in products.attributes as { [fieldId]: value } and are
// checked here against the type of each field.

export const FIELD_TYPES = ['text', 'number', 'choice', 'boolean'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

export interface FieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  /** Number fields only ("km", "m²"). */
  unit: string | null;
  /** Choice fields only. */
  options: string[] | null;
}

export const MAX_LABEL_LENGTH = 30;
export const MAX_UNIT_LENGTH = 10;
export const MAX_OPTION_LENGTH = 30;
export const MAX_OPTIONS = 20;
export const MAX_TEXT_VALUE_LENGTH = 80;
const MAX_NUMBER = 1_000_000_000;

/** Fields shown on the storefront card, at most. */
export const MAX_CARD_FIELDS = 2;

/** The parts of a field that depend on its type: a unit for numbers, options for choices. */
export function checkFieldShape(input: {
  type: FieldType;
  unit?: string | null;
  options?: string[] | null;
}): Pick<FieldDefinition, 'unit' | 'options'> {
  const unit = input.type === 'number' ? input.unit?.trim() || null : null;
  if (input.type !== 'choice') return { unit, options: null };

  const options: string[] = [];
  for (const option of input.options ?? []) {
    const value = option.trim();
    if (!value) continue;
    if (options.some((o) => o.toLowerCase() === value.toLowerCase())) {
      throw new BadRequestException(`A opção "${value}" está repetida`);
    }
    options.push(value);
  }
  if (options.length < 2) {
    throw new BadRequestException('Dê pelo menos duas opções');
  }
  return { unit: null, options };
}

/**
 * Checks the values sent for an item against the store's fields. Null or empty text
 * clears a value. A field id that isn't one of `fields` is refused.
 */
export function checkFieldValues(
  fields: FieldDefinition[],
  input: Record<string, unknown>,
): FieldValues {
  const values: FieldValues = {};
  for (const [id, raw] of Object.entries(input)) {
    const field = fields.find((f) => f.id === id);
    if (!field) {
      throw new BadRequestException(
        'Um dos campos foi apagado. Recarregue a página e tente de novo.',
      );
    }
    const value = checkValue(field, raw);
    if (value !== null) values[id] = value;
  }
  return values;
}

function checkValue(field: FieldDefinition, raw: unknown): FieldValue | null {
  if (raw === null || raw === undefined) return null;
  const invalid = () =>
    new BadRequestException(`Valor inválido em "${field.label}"`);

  switch (field.type) {
    case 'text': {
      if (typeof raw !== 'string') throw invalid();
      const value = raw.trim();
      if (value.length > MAX_TEXT_VALUE_LENGTH) {
        throw new BadRequestException(`"${field.label}" está muito longo`);
      }
      return value || null;
    }
    case 'number': {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) throw invalid();
      if (Math.abs(raw) > MAX_NUMBER) {
        throw new BadRequestException(`"${field.label}" está muito alto`);
      }
      // Two decimal places at most (1,5 m², 2,25 kg).
      return Math.round(raw * 100) / 100;
    }
    case 'choice': {
      if (raw === '') return null;
      if (typeof raw !== 'string' || !field.options?.includes(raw)) {
        throw new BadRequestException(
          `Escolha uma das opções de "${field.label}"`,
        );
      }
      return raw;
    }
    case 'boolean': {
      if (typeof raw !== 'boolean') throw invalid();
      return raw;
    }
  }
}

/** Whether a stored value still fits its field (an option may have been removed since). */
function fits(field: FieldDefinition, value: FieldValue | undefined): boolean {
  switch (field.type) {
    case 'text':
      return typeof value === 'string' && value !== '';
    case 'number':
      return typeof value === 'number';
    case 'choice':
      return typeof value === 'string' && !!field.options?.includes(value);
    case 'boolean':
      return typeof value === 'boolean';
  }
}

/** The stored values that still match `fields`, in the order of `fields`. */
export function currentFieldValues(
  fields: FieldDefinition[],
  values: FieldValues,
): { field: FieldDefinition; value: FieldValue }[] {
  return fields.flatMap((field) => {
    const value = values[field.id];
    return fits(field, value) ? [{ field, value: value! }] : [];
  });
}

const numberFormat = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
  // "2019" stays a year; "45.000" gets its separator.
  useGrouping: 'min2',
});

/** How a value reads on the storefront: "45.000 km", "Sim", "Automático". */
export function formatFieldValue(
  field: FieldDefinition,
  value: FieldValue,
): string {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') {
    const number = numberFormat.format(value);
    return field.unit ? `${number} ${field.unit}` : number;
  }
  return value;
}

/**
 * The short version for a storefront card: just the value ("2019", "45.000 km"), or the
 * field's name for a "yes" ("Aceita troca"). A "no" isn't worth a spot on the card.
 */
export function formatCardValue(
  field: FieldDefinition,
  value: FieldValue,
): string | null {
  if (typeof value === 'boolean') return value ? field.label : null;
  return formatFieldValue(field, value);
}
