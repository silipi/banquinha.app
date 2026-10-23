/**
 * Normalizes a Brazilian mobile number as people type it ("(41) 99999-9999",
 * "+55 41 99999 9999", "41999999999") to digits with the country code: 5541999999999.
 * Returns null when it is not a valid mobile number (WhatsApp in Brazil runs on mobiles).
 */
export function toWhatsappNumber(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) digits = digits.slice(2);
  // Area codes go from 11 to 99 with no zero; mobiles have 9 digits starting with 9.
  if (!/^[1-9][1-9]9\d{8}$/.test(digits)) return null;
  return `55${digits}`;
}
