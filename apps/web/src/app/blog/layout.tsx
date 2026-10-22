import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';

// Outside the (marketing) group so generated share images keep clean URLs
// (/blog/<slug>/opengraph-image), which the article's structured data links to.
export default function BlogLayout({ children }: LayoutProps<'/blog'>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
