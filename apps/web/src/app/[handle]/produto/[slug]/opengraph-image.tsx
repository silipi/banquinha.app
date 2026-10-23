import { ImageResponse } from 'next/og';
import {
  ogColors,
  ogFonts,
  ogImage,
  ogSize,
  OgWordmark,
  softColor,
} from '@/lib/og';
import { getProduct } from '@/lib/storefront';
import { formatBRL } from '@/lib/utils';

export const alt = 'Produto na banquinha.app';
export const size = ogSize;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; slug: string }>;
}) {
  const { handle, slug } = await params;
  const product = await getProduct(handle, slug);

  const cover =
    product?.images[0] && (await ogImage(product.images[0].url, 630, 630));

  return new ImageResponse(
    product ? (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: softColor(product.store.accentColor),
          color: ogColors.ink,
          fontFamily: 'Bricolage',
        }}
      >
        {cover && <img src={cover} width={630} height={630} alt="" />}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 56,
          }}
        >
          <div style={{ fontSize: 30, color: ogColors.muted }}>
            {product.store.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.05 }}>
              {product.name}
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 48,
                fontWeight: 700,
                color: product.store.accentColor,
              }}
            >
              {formatBRL(product.priceCents / 100)}
            </div>
          </div>
          <OgWordmark size={28} />
        </div>
      </div>
    ) : (
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
      </div>
    ),
    { ...size, fonts: ogFonts },
  );
}
