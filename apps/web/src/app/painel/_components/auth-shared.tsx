'use client';

import { authConfig, meGet } from '@banquinha/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isInAppBrowser, panelApi, panelPath } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { GoogleButton } from './GoogleButton';

export const NETWORK_ERROR = 'Sem conexão com a internet? Tente de novo.';

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
export const PASSWORD_MIN_LENGTH = 8;

/** Sends signed-in merchants straight to the panel. */
export function useRedirectIfSignedIn() {
  const router = useRouter();
  useEffect(() => {
    meGet({ client: panelApi })
      .then(({ data }) => data && router.replace(panelPath('/')))
      .catch(() => {});
  }, [router]);
}

/** Google button plus divider, when Google sign-in is on and the browser allows it. */
export function GoogleSection({
  text,
  onCredential,
}: {
  text: 'signup_with' | 'continue_with';
  onCredential: (credential: string) => void;
}) {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    authConfig({ client: panelApi })
      .then(({ data }) => {
        // Google blocks its sign-in inside Instagram's, TikTok's and similar browsers.
        if (data?.googleClientId && !isInAppBrowser(navigator.userAgent)) {
          setClientId(data.googleClientId);
        }
      })
      .catch(() => {});
  }, []);

  if (!clientId) return null;
  return (
    <>
      <GoogleButton
        clientId={clientId}
        text={text}
        onCredential={onCredential}
      />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> ou{' '}
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

export function LegalNote() {
  return (
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
  );
}
