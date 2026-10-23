import type { Metadata } from 'next';
import { SignIn } from '../_components/SignIn';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <SignIn
      heading="Entre na sua loja"
      description="Digite seu e-mail e enviamos um código para você entrar. Sem senha para lembrar."
    />
  );
}
