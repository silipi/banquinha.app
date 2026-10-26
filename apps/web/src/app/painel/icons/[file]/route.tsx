import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { ogColors, ogFonts } from '@/lib/og';

// App icons of the installable merchant area (see ../manifest.webmanifest).
const ICONS = {
  'icon-192.png': 192,
  'icon-512.png': 512,
  // iOS home screen; iOS rounds the corners itself.
  'apple-touch-icon.png': 180,
} as const;

export function generateStaticParams() {
  return Object.keys(ICONS).map((file) => ({ file }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<'/painel/icons/[file]'>,
) {
  const { file } = await params;
  const size = ICONS[file as keyof typeof ICONS];
  if (!size) notFound();

  // Full-bleed background with the mark inside the central 60%, so the same image
  // works as a maskable icon (Android crops it to a circle or a squircle).
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ogColors.ink,
        color: ogColors.paper,
        fontFamily: 'Bricolage',
        fontWeight: 700,
        fontSize: size * 0.52,
        lineHeight: 1,
        paddingBottom: size * 0.06,
      }}
    >
      b<span style={{ color: ogColors.brand }}>.</span>
    </div>,
    {
      width: size,
      height: size,
      fonts: ogFonts,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    },
  );
}
