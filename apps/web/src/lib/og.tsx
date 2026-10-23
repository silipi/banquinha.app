import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cacheLife } from 'next/cache';
import sharp from 'sharp';
import { absoluteUrl } from '@/lib/site';

// Helpers for the generated Open Graph images (1200x630 PNG, what WhatsApp and Instagram show).

export const ogSize = { width: 1200, height: 630 };

// Same palette as globals.css; ImageResponse cannot read CSS variables.
export const ogColors = {
  paper: '#faf7f2',
  ink: '#1a1714',
  muted: '#6b645b',
  brand: '#ff5a1f',
};

const fontsDir = join(
  process.cwd(),
  'node_modules/@fontsource/bricolage-grotesque/files',
);

// Satori reads woff/ttf/otf, not woff2.
const [regular, bold] = await Promise.all([
  readFile(join(fontsDir, 'bricolage-grotesque-latin-400-normal.woff')),
  readFile(join(fontsDir, 'bricolage-grotesque-latin-700-normal.woff')),
]);

export const ogFonts = [
  {
    name: 'Bricolage',
    data: regular,
    weight: 400 as const,
    style: 'normal' as const,
  },
  {
    name: 'Bricolage',
    data: bold,
    weight: 700 as const,
    style: 'normal' as const,
  },
];

/**
 * Fetches an image (absolute URL or a path served by this app) and returns it as a
 * PNG data URI cropped to the given size. Satori can't decode webp, which is what we store.
 */
export async function ogImage(
  url: string,
  width: number,
  height: number,
): Promise<string | null> {
  'use cache';
  cacheLife('days');

  try {
    const res = await fetch(absoluteUrl(url));
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(width, height, { fit: 'cover' })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

export function OgWordmark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', fontSize: size, fontWeight: 700 }}>
      banquinha<span style={{ color: ogColors.brand }}>.</span>app
    </div>
  );
}

/** Mixes a hex color with white, like the storefront's --store-soft. */
export function softColor(hex: string, amount = 0.14): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return ogColors.paper;
  const value = parseInt(match[1]!, 16);
  const channel = (shift: number) => {
    const c = (value >> shift) & 255;
    return Math.round(255 - (255 - c) * amount);
  };
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}
