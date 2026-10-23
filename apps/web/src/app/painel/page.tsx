'use client';

import { authLogout, meGet, type MeDto } from '@banquinha/api-client';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { panelApi, panelPath } from '@/lib/panel';

// Placeholder home of the merchant area until the store steps (P2-03) and dashboard land.
export default function PanelHomePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeDto | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    meGet({ client: panelApi })
      .then(({ data }) => {
        if (data) setMe(data);
        else router.replace(panelPath('/login'));
      })
      .catch(() => router.replace(panelPath('/login')));
  }, [router]);

  async function logout() {
    setLeaving(true);
    await authLogout({ client: panelApi }).catch(() => {});
    router.replace(panelPath('/login'));
  }

  if (!me) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Você entrou! 🎉
        </h1>
        <p className="mt-2 text-muted-foreground">
          Conectado como{' '}
          <strong className="font-medium break-words text-foreground">
            {me.email}
          </strong>
          . A criação da sua loja chega em breve.
        </p>
      </header>
      <Button variant="outline" onClick={logout} disabled={leaving}>
        Sair
      </Button>
    </div>
  );
}
