import { INSTAGRAM_USERNAME, toInstagramUsername } from './instagram.js';

describe('toInstagramUsername', () => {
  it.each([
    ['@Flores.da_Maria', 'flores.da_maria'],
    ['  flores ', 'flores'],
    ['https://www.instagram.com/flores/?hl=pt', 'flores'],
    ['instagram.com/flores', 'flores'],
  ])('reads %s as %s', (input, expected) => {
    expect(toInstagramUsername(input)).toBe(expected);
  });

  it('leaves invalid names for validation to reject', () => {
    expect(
      INSTAGRAM_USERNAME.test(toInstagramUsername('flores da maria')),
    ).toBe(false);
  });
});
