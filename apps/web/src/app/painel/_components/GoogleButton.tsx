'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

// The slice of Google Identity Services (https://developers.google.com/identity/gsi/web) used here.
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }): void;
      renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

/** Google's own "Continue with Google" button; hands back the ID token to send to the API. */
export function GoogleButton({
  clientId,
  onCredential,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const google = window.google;
    if (!ready || !google || !container.current) return;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => callback.current(response.credential),
    });
    google.accounts.id.renderButton(container.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      locale: 'pt-BR',
      width: container.current.offsetWidth,
    });
  }, [ready, clientId]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={container} className="flex h-11 w-full justify-center" />
    </>
  );
}
