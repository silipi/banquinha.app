// Input formatting only: the API validates prices.

const MAX_CENTS = 10_000_000;

/** Cents from what the person typed, reading digits as cents ("2590" → 2590 = R$ 25,90). */
export function parsePriceInput(input: string): number {
  const digits = input.replace(/\D/g, '').replace(/^0+/, '');
  return Math.min(Number(digits || 0), MAX_CENTS);
}

/** "25,90" for 2590, as shown in a price field next to a "R$" prefix. Empty for 0. */
export function formatPriceInput(cents: number): string {
  if (!cents) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
