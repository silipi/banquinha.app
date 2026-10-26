/**
 * Instagram username from what people paste: "@flores", "flores", or a profile link
 * ("https://www.instagram.com/flores/?hl=pt"). Lowercased, without the @.
 */
export function toInstagramUsername(input: string): string {
  const value = input.trim();
  const fromLink = /instagram\.com\/([^/?#]+)/i.exec(value);
  return (fromLink?.[1] ?? value).replace(/^@+/, '').toLowerCase();
}

/** Instagram allows letters, digits, periods and underscores, up to 30 characters. */
export const INSTAGRAM_USERNAME = /^[a-z0-9._]{1,30}$/;
