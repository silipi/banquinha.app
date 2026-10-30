'use client';

import {
  adminAuthLogout,
  adminAuthMe,
  type AdminMeDto,
} from '@banquinha/api-client';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminPath } from '@/lib/admin';
import { panelApi } from '@/lib/panel';
import { cn } from '@/lib/utils';
import { EnvironmentBadge, Loading } from '../_components/admin-ui';
import { AdminProvider } from './_components/admin-context';

const NAV = [
  { path: '/', label: 'Visão geral' },
  { path: '/lojas', label: 'Lojas' },
  { path: '/contas', label: 'Contas' },
  { path: '/auditoria', label: 'Auditoria' },
];

// Admin shell: a top bar with the environment, the sections and sign-out. Without a
// valid admin session, everything goes to the sign-in.
export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<AdminMeDto | null>(null);

  useEffect(() => {
    adminAuthMe({ client: panelApi })
      .then(({ data }) =>
        data ? setMe(data) : router.replace(adminPath('/login')),
      )
      .catch(() => router.replace(adminPath('/login')));
  }, [router]);

  if (!me) return <Loading />;

  // On the admin host the path has no /admin prefix.
  const current = pathname.replace(/^\/admin(?=\/|$)/, '') || '/';

  async function logout() {
    await adminAuthLogout({ client: panelApi });
    router.replace(adminPath('/login'));
  }

  return (
    <AdminProvider me={me}>
      <div
        className={cn(
          'flex min-h-dvh flex-1 flex-col',
          me.environment === 'production' && 'border-t-4 border-red-600',
        )}
      >
        <header className="border-b bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <span className="flex items-center gap-2 font-display font-bold">
              admin
              <EnvironmentBadge environment={me.environment} />
            </span>
            <nav className="flex flex-1 flex-wrap gap-1 text-sm">
              {NAV.map((item) => {
                const active =
                  item.path === '/'
                    ? current === '/'
                    : current.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    href={adminPath(item.path)}
                    className={cn(
                      'rounded-full px-3 py-1.5',
                      active ? 'bg-ink text-ink-foreground' : 'hover:bg-muted',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}
