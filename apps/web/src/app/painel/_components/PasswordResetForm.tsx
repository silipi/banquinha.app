'use client';

import {
  authRequestPasswordReset,
  authResetPassword,
} from '@banquinha/api-client';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi, panelPath } from '@/lib/panel';
import {
  EMAIL_PATTERN,
  NETWORK_ERROR,
  PASSWORD_MIN_LENGTH,
} from './auth-shared';
import { Field, FormError, PasswordField } from './fields';

const RESEND_AFTER_SECONDS = 30;

/** Forgot password: email → 6-digit code by email → new password. */
export function PasswordResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Confira o e-mail: parece que falta alguma coisa');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { error, response } = await authRequestPasswordReset({
        client: panelApi,
        body: { email },
      });
      if (!response?.ok) {
        setError(
          apiErrorMessage(
            error,
            'Não conseguimos enviar o código. Tente de novo.',
          ),
        );
        return;
      }
      setStep('code');
      setResendIn(RESEND_AFTER_SECONDS);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) return setError('O código tem 6 números');
    if (password.length < PASSWORD_MIN_LENGTH) {
      return setError(
        `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
      );
    }
    if (password !== confirm) return setError('As senhas não são iguais');

    setPending(true);
    setError(null);
    try {
      const { error, response } = await authResetPassword({
        client: panelApi,
        body: { email, code, password },
      });
      if (!response?.ok) {
        setError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      router.replace(panelPath('/'));
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  if (step === 'email') {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendCode();
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <Field
          label="E-mail da sua conta"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          inputMode="email"
          enterKeyHint="send"
          placeholder="voce@exemplo.com"
        />
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            'Enviar código'
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={savePassword} noValidate className="flex flex-col gap-4">
      <p className="text-pretty text-muted-foreground">
        Se existir uma conta com{' '}
        <strong className="font-medium break-words text-foreground">
          {email}
        </strong>
        , enviamos um código de 6 números. Olhe também o spam e a aba Promoções.
      </p>
      <Field
        label="Código do e-mail"
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
        }
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        className="text-center text-xl font-semibold tracking-[0.4em] tabular-nums"
      />
      <PasswordField
        label="Nova senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        hint={`Pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`}
      />
      <PasswordField
        label="Confirme a nova senha"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        autoComplete="new-password"
      />
      <FormError>{error}</FormError>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          'Salvar nova senha'
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={resendIn > 0 || pending}
        onClick={() => void sendCode()}
        className="self-center"
      >
        {resendIn > 0 ? `Reenviar código em ${resendIn}s` : 'Reenviar código'}
      </Button>
    </form>
  );
}
