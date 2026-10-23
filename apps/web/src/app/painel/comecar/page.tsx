'use client';

import { LoaderCircle } from 'lucide-react';
import { usePanelMe } from '../_components/use-panel-me';
import { Onboarding } from './_components/Onboarding';

export default function OnboardingPage() {
  const me = usePanelMe('onboarding');
  if (!me) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin" aria-label="Carregando" />
      </div>
    );
  }
  return <Onboarding me={me} />;
}
