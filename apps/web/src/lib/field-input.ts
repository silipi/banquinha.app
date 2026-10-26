import type { StoreFieldDto } from '@banquinha/api-client';

type FieldValue = string | number | boolean;

/**
 * Custom field values as the product editor holds them: text for every type ("45000",
 * "1.5" as a number input gives it, "true"), empty when not filled in.
 */
export type FieldDraft = Record<string, string>;

export const FIELD_TYPE_LABELS: Record<StoreFieldDto['type'], string> = {
  text: 'Texto',
  number: 'Número',
  choice: 'Lista de opções',
  boolean: 'Sim ou não',
};

export function fieldDraftFrom(
  fields: StoreFieldDto[],
  values: Record<string, FieldValue>,
): FieldDraft {
  return Object.fromEntries(
    fields.map((field) => {
      const value = values[field.id];
      return [field.id, value === undefined ? '' : String(value)];
    }),
  );
}

/** The values to send to the API; null clears one. */
export function fieldValuesForApi(
  fields: StoreFieldDto[],
  draft: FieldDraft,
): Record<string, FieldValue | null> {
  const values: Record<string, FieldValue | null> = {};
  for (const field of fields) {
    const text = (draft[field.id] ?? '').trim();
    if (!text) {
      values[field.id] = null;
    } else if (field.type === 'number') {
      values[field.id] = Number(text);
    } else if (field.type === 'boolean') {
      values[field.id] = text === 'true';
    } else {
      values[field.id] = text;
    }
  }
  return values;
}
