'use client';

import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';

/**
 * Panel modal: a sheet that fills the screen on phones and a centered card on larger
 * screens, with a fixed header and footer around a scrolling body. Escape, the
 * backdrop and the X all call `onClose`.
 */
export function Dialog({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="relative flex max-h-dvh w-full flex-col overflow-hidden bg-background shadow-xl max-sm:h-dvh sm:max-h-[90dvh] sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="relative flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center gap-2 border-t px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
