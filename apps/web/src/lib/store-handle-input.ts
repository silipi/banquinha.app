// Input formatting only: the API owns the handle rules and returns the final value.
const MAX_LENGTH = 30;

/**
 * Formats the store address while the user types. Keeps a trailing hyphen,
 * otherwise the space in "minha loja" would vanish on every keystroke.
 */
export function formatStoreHandleInput(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/g, '')
    .slice(0, MAX_LENGTH);
}
