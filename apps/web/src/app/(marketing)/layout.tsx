import { Footer } from '@/components/marketing/Footer';
import { Header } from '@/components/marketing/Header';

export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
