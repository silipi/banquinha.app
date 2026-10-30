import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · admin banquinha' },
  robots: { index: false, follow: false },
};

// Platform admin, served at admin.banquinha.app (see the host rewrite in next.config.ts).
// login: the sign-in. (app): everything else, behind an admin session.
export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return children;
}
