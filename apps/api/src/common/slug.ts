/**
 * URL-safe slug from free text: no accents, lowercase, only letters, digits and
 * single hyphens, cut at `maxLength` without leaving a trailing hyphen.
 */
export function toSlug(input: string, maxLength: number): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}
