import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChosenHandle } from '../_components/ChosenHandle';
import { SignIn } from '../_components/SignIn';

export const metadata: Metadata = { title: 'Criar loja' };

// Sign-up is the same passwordless flow as sign-in. P2-03 adds the store steps after it.
export default function SignupPage() {
  return (
    <SignIn
      heading="Crie sua loja grátis"
      description="Comece com seu e-mail. Em menos de 2 minutos sua loja está no ar."
      badge={
        <Suspense>
          <ChosenHandle />
        </Suspense>
      }
    />
  );
}
