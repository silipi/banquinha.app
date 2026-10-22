import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { JsonLd } from '@/components/json-ld';
import { buttonVariants } from '@/components/ui/button';
import {
  blogAuthor,
  blogPosts,
  formatPostDate,
  getBlogPost,
  getPostOutline,
  getRelatedPosts,
  postTimestamp,
} from '@/lib/blog';
import { absoluteUrl, openGraphDefaults, siteName } from '@/lib/site';
import { PostCard } from '@/components/blog/PostCard';

type Props = PageProps<'/blog/[slug]'>;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: blogAuthor }],
    alternates: { canonical: url },
    openGraph: {
      ...openGraphDefaults,
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      publishedTime: postTimestamp(post.publishedAt),
      modifiedTime: postTimestamp(post.updatedAt ?? post.publishedAt),
      authors: [blogAuthor],
      section: post.category,
      tags: post.keywords,
    },
  };
}

async function PostBody({ params }: Pick<Props, 'params'>) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const [{ default: Content }, outline] = await Promise.all([
    import(`@/content/blog/${post.slug}.mdx`),
    getPostOutline(post.slug),
  ]);
  const related = getRelatedPosts(post);
  const url = absoluteUrl(`/blog/${post.slug}`);

  const organization = {
    '@type': 'Organization',
    name: siteName,
    url: absoluteUrl('/'),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        url,
        mainEntityOfPage: url,
        image: absoluteUrl(`/blog/${post.slug}/opengraph-image`),
        datePublished: postTimestamp(post.publishedAt),
        dateModified: postTimestamp(post.updatedAt ?? post.publishedAt),
        inLanguage: 'pt-BR',
        articleSection: post.category,
        keywords: post.keywords.join(', '),
        author: organization,
        publisher: organization,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: absoluteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: absoluteUrl('/blog'),
          },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="mx-auto grid max-w-6xl gap-x-16 lg:grid-cols-[minmax(0,48rem)_15rem] lg:justify-between">
        <div className="min-w-0">
          <header>
            <nav aria-label="Navegação estrutural" className="text-sm">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Blog
              </Link>
              <span className="mx-2 text-border">/</span>
              <span className="text-muted-foreground">{post.category}</span>
            </nav>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl">
              {post.title}
            </h1>
            <p className="mt-5 text-lg text-pretty text-muted-foreground md:text-xl">
              {post.description}
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              {blogAuthor} ·{' '}
              <time dateTime={post.publishedAt}>
                {formatPostDate(post.publishedAt)}
              </time>{' '}
              · {outline.readingMinutes} min de leitura
            </p>
          </header>

          <div className="mt-12 border-t pt-10">
            <div className="prose prose-lg max-w-none prose-stone prose-headings:font-display prose-headings:tracking-tight prose-h2:scroll-mt-24 prose-a:text-brand prose-a:decoration-brand/40 prose-a:underline-offset-2 hover:prose-a:decoration-brand prose-strong:text-foreground">
              <Content />
            </div>
          </div>

          <aside className="mt-16 rounded-3xl bg-ink p-8 text-ink-foreground md:p-12">
            <p className="font-display text-3xl font-bold tracking-tight text-balance">
              Sua loja online, pronta em minutos.
            </p>
            <p className="mt-3 max-w-lg text-ink-foreground/70">
              Monte sua vitrine, coloque o link na bio e receba pedidos direto
              no WhatsApp. Grátis para começar.
            </p>
            <Link
              href="/cadastro"
              className={buttonVariants({
                variant: 'brand',
                className: 'mt-6',
              })}
            >
              Criar minha loja
            </Link>
          </aside>
        </div>

        {outline.headings.length > 2 && (
          <aside className="hidden lg:block">
            <nav aria-label="Neste artigo" className="sticky top-28 text-sm">
              <p className="font-medium">Neste artigo</p>
              <ol className="mt-3 space-y-2.5 border-l">
                {outline.headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="-ml-px block border-l border-transparent pl-4 text-pretty text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Continue lendo
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((other) => (
              <li key={other.slug}>
                <PostCard post={other} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function PostSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
      <div className="h-14 w-full animate-pulse rounded-2xl bg-muted" />
      <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export default function BlogPostPage({ params }: Props) {
  return (
    <article className="px-4 py-12 md:py-20">
      <Suspense fallback={<PostSkeleton />}>
        <PostBody params={params} />
      </Suspense>
    </article>
  );
}
