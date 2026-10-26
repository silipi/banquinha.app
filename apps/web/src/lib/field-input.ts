import type { StoreFieldDto } from '@banquinha/api-client';

type FieldValue = string | number | boolean;

/**
 * Custom field values as the product editor holds them: text for every type ("45000",
 * "1,5", "true"), empty when not filled in.
 */
export type FieldDraft = Record<string, string>;

export const FIELD_TYPE_LABELS: Record<StoreFieldDto['type'], string> = {
  text: 'Texto',
  number: 'Número',
  choice: 'Lista de opções',
  boolean: 'Sim ou não',
};

/** "45.000" or "1,5" as typed in Brazil; null when it isn't a number. */
export function parseNumberInput(text: string): number | null {
  const normalized = text.trim().replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

export function fieldDraftFrom(
  fields: StoreFieldDto[],
  values: Record<string, FieldValue>,
): FieldDraft {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values[field.id];
      if (value === undefined) return [field.id, ''];
      if (typeof value === 'number') {
        return [field.id, String(value).replace('.', ',')];
      }
      return [field.id, String(value)];
    }),
  );
}

/**
 * The values to send to the API (null clears one), or the first field with a number
 * that doesn't read as one.
 */
export function fieldValuesForApi(
  fields: StoreFieldDto[],
  draft: FieldDraft,
): { values: Record<string, FieldValue | null> } | { invalid: StoreFieldDto } {
  const values: Record<string, FieldValue | null> = {};
  for (const field of fields) {
    const text = (draft[field.id] ?? '').trim();
    if (!text) {
      values[field.id] = null;
    } else if (field.type === 'number') {
      const number = parseNumberInput(text);
      if (number === null) return { invalid: field };
      values[field.id] = number;
    } else if (field.type === 'boolean') {
      values[field.id] = text === 'true';
    } else {
      values[field.id] = text;
    }
  }
  return { values };
}
