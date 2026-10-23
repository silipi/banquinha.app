'use client';

import { authGoogle, authLogin } from '@banquinha/api-client';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi, panelPath } from '@/lib/panel';
import {
  GoogleSection,
  NETWORK_ERROR,
  useRedirectIfSignedIn,
} from './auth-shared';
import { Field, FormError, PasswordField } from './fields';

export function LoginForm() {
  const router = useRouter();
  useRedirectIfSignedIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const enterPanel = () => router.replace(panelPath('/'));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Digite seu e-mail e sua senha.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { error, response } = await authLogin({
        client: panelApi,
        body: { email, password },
      });
      if (!response?.ok) {
        setError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      enterPanel();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle(credential: string) {
    setError(null);
    try {
      const { error, response } = await authGoogle({
        client: panelApi,
        body: { credential },
      });
      if (!response?.ok) {
        setError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      enterPanel();
    } catch {
      setError(NETWORK_ERROR);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleSection text="continue_with" onCredential={signInWithGoogle} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label="E-mail"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="voce@exemplo.com"
        />
        <PasswordField
          label="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          enterKeyHint="go"
        />
        {/* Relative, so it works both on the app. host and under /painel. */}
        <a
          href="recuperar-senha"
          className="-mt-2 w-fit text-sm font-medium underline underline-offset-4"
        >
          Esqueci minha senha
        </a>
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? <LoaderCircle className="animate-spin" /> : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
