import type { Metadata, Viewport } from 'next';
import { RegisterServiceWorker } from './_components/RegisterServiceWorker';

// /painel/* also works on the minha. host (next.config.ts lets it through), so these
// paths are valid on both hosts.
export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · banquinha.app' },
  robots: { index: false, follow: false },
  manifest: '/painel/manifest.webmanifest',
  icons: { apple: '/painel/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'banquinha', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#faf7f2' };

// Merchant area, served at minha.banquinha.app (see the host rewrite in next.config.ts).
// (auth): sign-in screens. comecar: the onboarding. (app): the dashboard with the sidebar.
export default function PanelRootLayout({ children }: LayoutProps<'/painel'>) {
  return (
    <>
      <RegisterServiceWorker />
      {children}
    </>
  );
}
