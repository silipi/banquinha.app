import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Criar sua loja' };

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
