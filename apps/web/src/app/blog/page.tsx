import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { blogPosts } from '@/lib/blog';
import { absoluteUrl, openGraphDefaults, siteName } from '@/lib/site';
import { PostCard } from '@/components/blog/PostCard';

const title = 'Blog: dicas para vender online';
const description =
  'Guias práticos para quem vende pelo Instagram e pelo WhatsApp: loja virtual, precificação, divulgação e atendimento.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/blog',
    types: { 'application/rss+xml': '/blog/rss.xml' },
  },
  openGraph: { ...openGraphDefaults, title, description, url: '/blog' },
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Blog da ${siteName}`,
    description,
    url: absoluteUrl('/blog'),
    inLanguage: 'pt-BR',
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <JsonLd data={jsonLd} />
      <p className="text-sm font-medium text-brand">Blog</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl font-bold tracking-tight text-balance md:text-6xl">
        Dicas para vender mais pela internet.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
        {description}
      </p>

      {featured && (
        <div className="mt-14">
          <PostCard post={featured} featured />
        </div>
      )}
      <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <li key={post.slug}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
