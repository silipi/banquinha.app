// WCAG 2 contrast for live previews of colors merchants pick. The API decides the
// stored text color (apps/api/src/themes/contrast.ts); this only mirrors it on screen.

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

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

export function readableTextOn(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) >=
    contrastRatio(background, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}
