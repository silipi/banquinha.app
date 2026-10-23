import { toWhatsappNumber } from './whatsapp-number.js';

describe('toWhatsappNumber', () => {
  it.each([
    ['(41) 99999-1234', '5541999991234'],
    ['41999991234', '5541999991234'],
    ['+55 41 99999 1234', '5541999991234'],
    ['5541999991234', '5541999991234'],
  ])('normalizes %s', (input, expected) => {
    expect(toWhatsappNumber(input)).toBe(expected);
  });

  it.each([
    ['', 'empty'],
    ['99999-1234', 'no area code'],
    ['(41) 3333-1234', 'landline'],
    ['(01) 99999-1234', 'invalid area code'],
    ['(41) 99999-12345', 'too long'],
  ])('rejects %s (%s)', (input) => {
    expect(toWhatsappNumber(input)).toBeNull();
  });
});
