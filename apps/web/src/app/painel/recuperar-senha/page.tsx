import type { Metadata } from 'next';
import { AuthPage } from '../_components/AuthPage';
import { PasswordResetForm } from '../_components/PasswordResetForm';

export const metadata: Metadata = { title: 'Criar nova senha' };

export default function PasswordResetPage() {
  return (
    <AuthPage
      heading="Criar nova senha"
      description="Enviamos um código para o seu e-mail e você escolhe uma senha nova."
      footer={{ text: 'Lembrou?', link: 'Voltar para entrar', href: 'login' }}
    >
      <PasswordResetForm />
    </AuthPage>
  );
}
