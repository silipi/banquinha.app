'use client';

import { Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { rememberChosenHandle } from '@/lib/onboarding-draft';
import { storeDisplayUrl } from '@/lib/storefront-links';

/** The handle picked on the landing, shown as a step already done (endowed progress). */
export function ChosenHandle() {
  const handle = useSearchParams().get('loja');

  useEffect(() => {
    if (handle) rememberChosenHandle(handle);
  }, [handle]);

  if (!handle) return null;
  return (
    <p className="mb-4 inline-flex max-w-full items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-sm font-medium">
      <Check className="size-4 shrink-0" />
      <span className="truncate">{storeDisplayUrl(handle)} está livre</span>
    </p>
  );
}
