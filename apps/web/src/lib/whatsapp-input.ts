// Input formatting only: the API validates the number and stores it normalized.

/** Formats a Brazilian mobile number while the user types: "(41) 99999-1234". */
export function formatWhatsappInput(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Whether the typed number has the 11 digits of a mobile with area code. */
export function isCompleteWhatsapp(input: string): boolean {
  return /^\d{2}9\d{8}$/.test(input.replace(/\D/g, ''));
}
