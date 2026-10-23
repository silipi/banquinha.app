import type { Metadata } from 'next';
import { AuthPage } from '../../_components/AuthPage';
import { LoginForm } from '../../_components/LoginForm';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <AuthPage
      heading="Entre na sua loja"
      description="Use o e-mail e a senha que você cadastrou."
      footer={{
        text: 'Ainda não tem loja?',
        link: 'Criar grátis',
        href: 'cadastro',
      }}
    >
      <LoginForm />
    </AuthPage>
  );
}
