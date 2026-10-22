import { ImageResponse } from 'next/og';
import {
  ogColors,
  ogFonts,
  ogImage,
  ogSize,
  OgWordmark,
  softColor,
} from '@/lib/og';
import { getStore } from '@/lib/storefront';
import { storeDisplayUrl } from '@/lib/storefront-links';

export const alt = 'Loja na vendeu.store';
export const size = ogSize;
export const contentType = 'image/png';

// Three photos fill the 1072px content width (1200 - 2 * 64 padding) with 24px gaps.
const PHOTO_WIDTH = 341;
const PHOTO_HEIGHT = 300;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const store = await getStore(handle);

  if (!store) {
    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: ogColors.paper,
          color: ogColors.ink,
          fontFamily: 'Bricolage',
        }}
      >
        <OgWordmark size={72} />
      </div>,
      { ...size, fonts: ogFonts },
    );
  }

  const [logo, ...photos] = await Promise.all([
    store.logoUrl ? ogImage(store.logoUrl, 160, 160) : null,
    ...store.products
      .slice(0, 3)
      .map((product) =>
        product.imageUrl
          ? ogImage(product.imageUrl, PHOTO_WIDTH, PHOTO_HEIGHT)
          : null,
      ),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 64,
        background: softColor(store.accentColor),
        color: ogColors.ink,
        fontFamily: 'Bricolage',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 999,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: store.accentColor,
              color: 'white',
              fontSize: 64,
              fontWeight: 700,
              border: '6px solid white',
            }}
          >
            {logo ? (
              <img src={logo} width={128} height={128} alt="" />
            ) : (
              store.name.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>
              {store.name}
            </div>
            <div style={{ marginTop: 8, fontSize: 30, color: ogColors.muted }}>
              {store.city ?? storeDisplayUrl(store.handle)}
            </div>
          </div>
        </div>
        <OgWordmark size={30} />
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {photos.map((photo, index) =>
          photo ? (
            <img
              key={index}
              src={photo}
              width={PHOTO_WIDTH}
              height={PHOTO_HEIGHT}
              alt=""
              style={{ borderRadius: 32 }}
            />
          ) : null,
        )}
      </div>
    </div>,
    { ...size, fonts: ogFonts },
  );
}
