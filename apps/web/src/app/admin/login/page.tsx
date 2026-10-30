'use client';

import { adminAuthLogin } from '@banquinha/api-client';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminPath } from '@/lib/admin';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { Field, FormError } from '../../painel/_components/fields';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const { error: failed } = await adminAuthLogin({
      client: panelApi,
      body: {
        username: String(form.get('username')),
        password: String(form.get('password')),
        code: String(form.get('code')).replace(/\D/g, ''),
      },
    });
    setBusy(false);
    if (failed) {
      setError(apiErrorMessage(failed, 'Não foi possível entrar.'));
      return;
    }
    router.replace(adminPath('/'));
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-surface p-6"
      >
        <h1 className="font-display text-2xl font-bold">Admin</h1>
        <Field
          label="Usuário"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Field
          label="Código do app autenticador"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
        />
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" />}
          Entrar
        </Button>
      </form>
    </main>
  );
}
