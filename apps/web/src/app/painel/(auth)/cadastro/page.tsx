import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPage } from '../../_components/AuthPage';
import { ChosenHandle } from '../../_components/ChosenHandle';
import { SignupForm } from '../../_components/SignupForm';

export const metadata: Metadata = { title: 'Criar loja' };

// Account first; P2-03 adds the store steps after it.
export default function SignupPage() {
  return (
    <AuthPage
      badge={
        <Suspense>
          <ChosenHandle />
        </Suspense>
      }
      heading="Crie sua loja grátis"
      description="Primeiro, sua conta. Depois a gente monta a loja junto, em poucos minutos."
      footer={{ text: 'Já tem conta?', link: 'Entrar', href: 'login' }}
    >
      <SignupForm />
    </AuthPage>
  );
}
