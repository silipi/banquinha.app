import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist } from 'next/font/google';
import { openGraphDefaults, siteName, siteUrl } from '@/lib/site';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
});

const defaultTitle = 'vendeu.store — sua loja online, pronta em minutos';
const defaultDescription =
  'Crie sua loja online grátis, compartilhe um link na bio e receba pedidos direto no WhatsApp. Feito para quem vende pelo Instagram.';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: defaultTitle,
    template: '%s · vendeu.store',
  },
  description: defaultDescription,
  applicationName: siteName,
  openGraph: {
    ...openGraphDefaults,
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${bricolage.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
