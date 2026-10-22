import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'vendeu.store — sua loja online, pronta em minutos',
    template: '%s · vendeu.store',
  },
  description:
    'Crie sua loja online grátis, compartilhe um link na bio e receba pedidos direto no WhatsApp. Feito para quem vende pelo Instagram.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${bricolage.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
