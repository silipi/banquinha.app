'use client';

import {
  authConfig,
  authGoogle,
  authRequestCode,
  authVerifyCode,
  meGet,
} from '@banquinha/api-client';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  apiErrorMessage,
  isInAppBrowser,
  panelApi,
  panelPath,
} from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { GoogleButton } from './GoogleButton';

const RESEND_AFTER_SECONDS = 30;
const CODE_LENGTH = 6;
const NETWORK_ERROR = 'Sem conexão com a internet? Tente de novo.';

const inputClass =
  'h-13 w-full rounded-2xl border bg-surface px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40 aria-invalid:border-red-400';

/**
 * Passwordless sign-in, which is also sign-up: email → 6-digit code, or Google.
 * The code is typed on the same screen, so it works inside Instagram's and TikTok's
 * browsers, where Google sign-in is blocked and magic links would open elsewhere.
 */
export function SignIn({
  heading,
  description,
  badge,
}: {
  heading: string;
  description: string;
  badge?: ReactNode;
}) {
  const router = useRouter();
  const id = useId();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  const enterPanel = useCallback(
    () => router.replace(panelPath('/')),
    [router],
  );

  useEffect(() => {
    // Already signed in: skip this screen.
    meGet({ client: panelApi })
      .then(({ data }) => data && enterPanel())
      .catch(() => {});
    authConfig({ client: panelApi })
      .then(({ data }) => {
        if (data?.googleClientId && !isInAppBrowser(navigator.userAgent)) {
          setGoogleClientId(data.googleClientId);
        }
      })
      .catch(() => {});
  }, [enterPanel]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode() {
    setPending(true);
    setError(null);
    try {
      const { error, response } = await authRequestCode({
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
      setCode('');
      setResendIn(RESEND_AFTER_SECONDS);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  async function verify(value: string) {
    setPending(true);
    setError(null);
    try {
      const { error, response } = await authVerifyCode({
        client: panelApi,
        body: { email, code: value },
      });
      if (!response?.ok) {
        setError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        setCode('');
        return;
      }
      enterPanel();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  const signInWithGoogle = useCallback(
    async (credential: string) => {
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
    },
    [enterPanel],
  );

  function handleCodeChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    // Submits on its own once complete, also when the phone autofills the code.
    if (digits.length === CODE_LENGTH && !pending) void verify(digits);
  }

  const errorId = `${id}-error`;
  const errorMessage = (
    <p id={errorId} role="alert" className="min-h-5 text-sm text-red-600">
      {error}
    </p>
  );

  if (step === 'code') {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => {
            setStep('email');
            setError(null);
          }}
          className="-ml-1 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Usar outro e-mail
        </button>
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
            Confira seu e-mail
          </h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            Enviamos um código de 6 números para{' '}
            <strong className="font-medium break-words text-foreground">
              {email}
            </strong>
            .
          </p>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length === CODE_LENGTH) void verify(code);
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor={`${id}-code`} className="sr-only">
            Código de 6 números
          </label>
          <input
            id={`${id}-code`}
            value={code}
            onChange={(event) => handleCodeChange(event.target.value)}
            autoFocus
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            placeholder="000000"
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            className={`${inputClass} text-center text-2xl font-semibold tracking-[0.5em] tabular-nums`}
          />
          {errorMessage}
          {pending && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Conferindo…
            </p>
          )}
        </form>
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          <p>Não chegou? Olhe também o spam e a aba Promoções.</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={resendIn > 0 || pending}
            onClick={() => void sendCode()}
          >
            {resendIn > 0
              ? `Reenviar código em ${resendIn}s`
              : 'Reenviar código'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        {badge}
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
          {heading}
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">{description}</p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendCode();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={`${id}-email`} className="text-sm font-medium">
          Seu e-mail
        </label>
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          enterKeyHint="go"
          placeholder="voce@exemplo.com"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={inputClass}
        />
        {errorMessage}
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? <LoaderCircle className="animate-spin" /> : 'Continuar'}
        </Button>
      </form>

      {googleClientId && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou{' '}
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton
            clientId={googleClientId}
            onCredential={signInWithGoogle}
          />
        </>
      )}

      <p className="text-center text-xs text-pretty text-muted-foreground">
        Ao continuar, você concorda com os{' '}
        <a href={absoluteUrl('/termos')} className="underline">
          Termos de uso
        </a>{' '}
        e a{' '}
        <a href={absoluteUrl('/privacidade')} className="underline">
          Política de privacidade
        </a>
        .
      </p>
    </div>
  );
}
