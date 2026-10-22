import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import GithubSlugger from 'github-slugger';
import { cacheLife } from 'next/cache';

// Blog posts: metadata lives here, the body in src/content/blog/<slug>.mdx.
// Marketing content, not business data, so it stays in the web app.

export type BlogTone = 'sage' | 'lilac' | 'butter' | 'sky';

export type BlogPost = {
  slug: string;
  title: string;
  /** Meta description and card summary. Keep it under ~160 characters. */
  description: string;
  category: string;
  /** YYYY-MM-DD, Brasília time. */
  publishedAt: string;
  updatedAt?: string;
  keywords: string[];
  /** Pastel used on cards and the share image. */
  tone: BlogTone;
};

export const blogAuthor = 'Equipe vendeu.store';

const posts: BlogPost[] = [
  {
    slug: 'como-vender-pelo-instagram',
    title: 'Como vender pelo Instagram: guia completo para começar do zero',
    description:
      'Perfil, conteúdo, link na bio e atendimento: o passo a passo para transformar seguidores em clientes no Instagram, mesmo com pouco tempo.',
    category: 'Redes sociais',
    publishedAt: '2026-08-18',
    keywords: [
      'como vender pelo instagram',
      'vender no instagram',
      'instagram para negócios',
      'vendas pelo instagram',
    ],
    tone: 'lilac',
  },
  {
    slug: 'como-criar-loja-virtual-gratis',
    title: 'Como criar uma loja virtual grátis em 2026 (passo a passo)',
    description:
      'O que você precisa para abrir uma loja online sem pagar nada, como escolher a plataforma certa e o que fazer na primeira semana.',
    category: 'Loja online',
    publishedAt: '2026-09-01',
    keywords: [
      'loja virtual grátis',
      'como criar loja virtual',
      'criar loja online grátis',
      'loja online para iniciantes',
    ],
    tone: 'sage',
  },
  {
    slug: 'whatsapp-business-catalogo-e-pedidos',
    title: 'WhatsApp Business: como usar o catálogo e organizar seus pedidos',
    description:
      'Configure o perfil comercial, monte o catálogo, use etiquetas e respostas rápidas e pare de perder pedidos no meio das conversas.',
    category: 'WhatsApp',
    publishedAt: '2026-09-15',
    keywords: [
      'whatsapp business',
      'catálogo whatsapp business',
      'como vender pelo whatsapp',
      'pedidos pelo whatsapp',
    ],
    tone: 'sky',
  },
  {
    slug: 'como-precificar-produtos-artesanais',
    title: 'Como precificar produtos artesanais (com fórmula e exemplo)',
    description:
      'Calcule custo de material, valor da sua hora, despesas e margem sem chute. Com uma fórmula simples e um exemplo completo.',
    category: 'Gestão',
    publishedAt: '2026-09-29',
    keywords: [
      'como precificar produtos artesanais',
      'como calcular preço de venda',
      'precificação artesanato',
      'markup',
    ],
    tone: 'butter',
  },
  {
    slug: 'o-que-vender-pela-internet',
    title: 'O que vender pela internet: 15 ideias para começar com pouco',
    description:
      'Ideias de produtos para vender online em 2026, como validar antes de investir e o que observar no estoque, no frete e na margem.',
    category: 'Empreender',
    publishedAt: '2026-10-08',
    keywords: [
      'o que vender pela internet',
      'ideias de produtos para vender',
      'o que vender para ganhar dinheiro',
      'produtos para vender online',
    ],
    tone: 'sage',
  },
  {
    slug: 'link-na-bio-para-vender',
    title: 'Link na bio: o que colocar para vender mais (e o que evitar)',
    description:
      'O link da bio é a porta da sua loja. Veja o que funciona melhor para quem vende, como chamar atenção para ele e erros que espantam clientes.',
    category: 'Redes sociais',
    publishedAt: '2026-10-20',
    keywords: [
      'link na bio',
      'o que colocar no link da bio',
      'link na bio instagram',
      'link da bio para vendas',
    ],
    tone: 'lilac',
  },
];

/** All posts, newest first. */
export const blogPosts = [...posts].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}

/** Other posts to read next: same category first, then the most recent. */
export function getRelatedPosts(post: BlogPost, count = 3) {
  const others = blogPosts.filter((other) => other.slug !== post.slug);
  return [
    ...others.filter((other) => other.category === post.category),
    ...others.filter((other) => other.category !== post.category),
  ].slice(0, count);
}

/** ISO timestamp at 9:00 in Brasília, for structured data and Open Graph. */
export function postTimestamp(date: string) {
  return `${date}T09:00:00-03:00`;
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatPostDate(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

export type PostOutline = {
  readingMinutes: number;
  headings: { id: string; text: string }[];
};

/** Reading time and H2 headings (ids match rehype-slug) read from the MDX source. */
export async function getPostOutline(slug: string): Promise<PostOutline> {
  'use cache';
  cacheLife('max');

  const source = await readFile(
    join(process.cwd(), 'src/content/blog', `${slug}.mdx`),
    'utf8',
  );
  const words = source.split(/\s+/).filter(Boolean).length;
  const slugger = new GithubSlugger();
  const headings = [...source.matchAll(/^## (.+)$/gm)].map(([, raw]) => {
    const text = raw!.replace(/[*_`]/g, '').trim();
    return { id: slugger.slug(text), text };
  });

  return { readingMinutes: Math.max(1, Math.round(words / 200)), headings };
}
