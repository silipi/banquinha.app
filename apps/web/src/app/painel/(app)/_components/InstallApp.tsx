'use client';

import { Share, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Chrome's install prompt event (not in the DOM typings yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Mode = 'hidden' | 'prompt' | 'ios';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac with touch.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * "Install on the phone" entry in the sidebar. Android/Chrome get the native prompt;
 * iOS has none, so it explains Share → Add to Home Screen. Hidden once installed.
 */
export function InstallApp() {
  const [mode, setMode] = useState<Mode>('hidden');
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setMode('prompt');
    };
    const onInstalled = () => setMode('hidden');
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    // Safari on iOS never fires beforeinstallprompt.
    const ios = isIos() ? window.setTimeout(() => setMode('ios'), 0) : null;
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (ios) window.clearTimeout(ios);
    };
  }, []);

  if (mode === 'hidden') return null;

  async function install() {
    if (mode === 'ios') {
      setShowIosHelp((v) => !v);
      return;
    }
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') setMode('hidden');
    setEvent(null);
  }

  return (
    <div className="rounded-2xl border bg-surface p-3">
      <button
        type="button"
        onClick={() => void install()}
        aria-expanded={mode === 'ios' ? showIosHelp : undefined}
        className="flex w-full items-center gap-3 text-left text-sm"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink text-ink-foreground">
          <Smartphone className="size-4" />
        </span>
        <span>
          <span className="block font-medium">Instalar no celular</span>
          <span className="block text-xs text-muted-foreground">
            Abra o painel direto da tela inicial.
          </span>
        </span>
      </button>
      {showIosHelp && (
        <div className="relative mt-3 rounded-xl bg-muted p-3 pr-8 text-xs leading-relaxed">
          <button
            type="button"
            onClick={() => setShowIosHelp(false)}
            aria-label="Fechar"
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full hover:bg-background"
          >
            <X className="size-3.5" />
          </button>
          No Safari, toque em{' '}
          <Share className="inline size-3.5 align-text-bottom" />{' '}
          <strong>Compartilhar</strong> e depois em{' '}
          <strong>Adicionar à Tela de Início</strong>.
        </div>
      )}
    </div>
  );
}
