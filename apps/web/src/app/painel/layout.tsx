import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · banquinha.app' },
  robots: { index: false, follow: false },
};

// Merchant area, served at app.banquinha.app (see the host rewrite in next.config.ts).
// (auth): sign-in screens. comecar: the onboarding. (app): the dashboard with the sidebar.
export default function PanelRootLayout({ children }: LayoutProps<'/painel'>) {
  return children;
}
