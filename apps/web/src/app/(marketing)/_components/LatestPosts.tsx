import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PostCard } from '@/components/blog/PostCard';
import { buttonVariants } from '@/components/ui/button';
import { blogPosts } from '@/lib/blog';
import { SectionHeading } from './SectionHeading';

export function LatestPosts() {
  return (
    <section className="px-4 py-24">
      <SectionHeading
        eyebrow="Blog"
        title="Dicas para vender mais pela internet."
        description="Guias práticos para quem vende pelo Instagram e pelo WhatsApp."
      />
      <ul className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
        {blogPosts.slice(0, 3).map((post) => (
          <li key={post.slug}>
            <PostCard post={post} headingLevel="h3" />
          </li>
        ))}
      </ul>
      <div className="mt-10 flex justify-center">
        <Link href="/blog" className={buttonVariants({ variant: 'outline' })}>
          Ver todos os artigos <ArrowRight />
        </Link>
      </div>
    </section>
  );
}
