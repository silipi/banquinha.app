import Link from 'next/link';
import {
  formatPostDate,
  getPostOutline,
  type BlogPost,
  type BlogTone,
} from '@/lib/blog';
import { cn } from '@/lib/utils';

export const toneClasses: Record<BlogTone, string> = {
  sage: 'bg-sage',
  lilac: 'bg-lilac',
  butter: 'bg-butter',
  sky: 'bg-sky',
};

export async function PostCard({
  post,
  featured = false,
  headingLevel: Heading = 'h2',
}: {
  post: BlogPost;
  featured?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  const { readingMinutes } = await getPostOutline(post.slug);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'group flex h-full flex-col rounded-3xl p-6 transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none md:p-8',
        toneClasses[post.tone],
        featured && 'md:p-12',
      )}
    >
      <span className="w-fit rounded-full bg-surface/70 px-3 py-1 text-xs font-medium">
        {post.category}
      </span>
      <Heading
        className={cn(
          'mt-5 font-display font-bold tracking-tight text-balance group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4',
          featured ? 'text-3xl md:text-5xl' : 'text-2xl',
        )}
      >
        {post.title}
      </Heading>
      <p
        className={cn(
          'mt-3 text-pretty text-foreground/70',
          featured && 'max-w-2xl md:text-lg',
        )}
      >
        {post.description}
      </p>
      <p className="mt-auto pt-6 text-sm text-foreground/60">
        <time dateTime={post.publishedAt}>
          {formatPostDate(post.publishedAt)}
        </time>{' '}
        · {readingMinutes} min de leitura
      </p>
    </Link>
  );
}
