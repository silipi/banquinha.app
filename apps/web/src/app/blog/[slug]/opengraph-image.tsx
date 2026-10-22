import { ImageResponse } from 'next/og';
import { getBlogPost, type BlogTone } from '@/lib/blog';
import { ogColors, ogFonts, ogSize, OgWordmark } from '@/lib/og';

export const alt = 'Artigo do blog da vendeu.store';
export const size = ogSize;
export const contentType = 'image/png';

// Same pastels as globals.css.
const toneColors: Record<BlogTone, string> = {
  sage: '#dfe8d5',
  lilac: '#e7e0f5',
  butter: '#fbefc4',
  sky: '#d9e9f5',
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: post ? toneColors[post.tone] : ogColors.paper,
        color: ogColors.ink,
        fontFamily: 'Bricolage',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <OgWordmark size={36} />
        {post && (
          <div
            style={{
              display: 'flex',
              padding: '10px 24px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.7)',
              fontSize: 26,
            }}
          >
            {post.category}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: post && post.title.length > 60 ? 64 : 76,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -1.5,
        }}
      >
        {post?.title ?? 'Blog da vendeu.store'}
      </div>
      <div style={{ display: 'flex', fontSize: 28, color: ogColors.muted }}>
        vendeu.store/blog
      </div>
    </div>,
    { ...size, fonts: ogFonts },
  );
}
