// WCAG 2 contrast, used to pick legible text for colors merchants choose.

const DARK_TEXT = '#1a1714';
const LIGHT_TEXT = '#ffffff';

function luminance(hex: string): number {
  const value = parseInt(hex.slice(1), 16);
  const [r, g, b] = [16, 8, 0].map((shift) => {
    const channel = ((value >> shift) & 255) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** From 1 (same color) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

/** Near-black or white, whichever reads better on `background`. */
export function readableTextOn(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) >=
    contrastRatio(background, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}
