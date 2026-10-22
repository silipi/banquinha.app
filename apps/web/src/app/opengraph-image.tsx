import { ImageResponse } from 'next/og';
import { ogColors, ogFonts, ogSize, OgWordmark } from '@/lib/og';

export const alt = 'vendeu.store — sua loja online, pronta em minutos';
export const size = ogSize;
export const contentType = 'image/png';

const pastels = ['#dfe8d5', '#e7e0f5', '#fbefc4', '#d9e9f5'];

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: ogColors.paper,
        color: ogColors.ink,
        fontFamily: 'Bricolage',
      }}
    >
      <OgWordmark size={40} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Sua loja online, pronta em minutos.
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: ogColors.muted }}>
          Link na bio, pedidos direto no WhatsApp.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {pastels.map((color) => (
          <div
            key={color}
            style={{
              width: 120,
              height: 24,
              borderRadius: 999,
              background: color,
            }}
          />
        ))}
        <div
          style={{
            width: 120,
            height: 24,
            borderRadius: 999,
            background: ogColors.brand,
          }}
        />
      </div>
    </div>,
    { ...size, fonts: ogFonts },
  );
}
