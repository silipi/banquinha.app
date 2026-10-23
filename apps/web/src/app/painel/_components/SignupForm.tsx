'use client';

import { authGoogle, authSignup } from '@banquinha/api-client';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi, panelPath } from '@/lib/panel';
import { formatWhatsappInput, isCompleteWhatsapp } from '@/lib/whatsapp-input';
import {
  EMAIL_PATTERN,
  GoogleSection,
  LegalNote,
  NETWORK_ERROR,
  PASSWORD_MIN_LENGTH,
  useRedirectIfSignedIn,
} from './auth-shared';
import { Field, FormError, PasswordField } from './fields';

const FIELDS = ['name', 'email', 'whatsapp', 'password', 'confirm'] as const;
type FieldName = (typeof FIELDS)[number];
type Values = Record<FieldName, string>;

// Mirrors the API's rules for instant feedback; the API still has the final word.
function validate(field: FieldName, values: Values): string | null {
  switch (field) {
    case 'name':
      return values.name.trim().length < 2 ? 'Informe seu nome' : null;
    case 'email':
      return EMAIL_PATTERN.test(values.email.trim())
        ? null
        : 'Confira o e-mail: parece que falta alguma coisa';
    case 'whatsapp':
      return isCompleteWhatsapp(values.whatsapp)
        ? null
        : 'Confira o WhatsApp: use o DDD e o número do celular';
    case 'password':
      return values.password.length < PASSWORD_MIN_LENGTH
        ? `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`
        : null;
    case 'confirm':
      return values.confirm !== values.password
        ? 'As senhas não são iguais'
        : null;
  }
}

export function SignupForm() {
  const router = useRouter();
  useRedirectIfSignedIn();
  const [values, setValues] = useState<Values>({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const field = (name: FieldName) => ({
    value: values[name],
    error: errors[name],
    onChange: (event: { target: { value: string } }) => {
      const value =
        name === 'whatsapp'
          ? formatWhatsappInput(event.target.value)
          : event.target.value;
      setValues((v) => ({ ...v, [name]: value }));
      setErrors((e) => ({ ...e, [name]: undefined }));
    },
    // Validate when leaving a filled field, not on every keystroke.
    onBlur: () => {
      if (!values[name]) return;
      setErrors((e) => ({ ...e, [name]: validate(name, values) ?? undefined }));
    },
  });

  const enterPanel = () => router.replace(panelPath('/'));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = Object.fromEntries(
      FIELDS.map((name) => [name, validate(name, values) ?? undefined]),
    );
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setPending(true);
    setFormError(null);
    try {
      const { error, response } = await authSignup({
        client: panelApi,
        body: {
          name: values.name,
          email: values.email,
          whatsapp: values.whatsapp,
          password: values.password,
        },
      });
      if (response?.status === 409) {
        setErrors({ email: apiErrorMessage(error, 'E-mail já cadastrado') });
        return;
      }
      if (!response?.ok) {
        setFormError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      enterPanel();
    } catch {
      setFormError(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  async function signUpWithGoogle(credential: string) {
    setFormError(null);
    try {
      const { error, response } = await authGoogle({
        client: panelApi,
        body: { credential },
      });
      if (!response?.ok) {
        setFormError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      enterPanel();
    } catch {
      setFormError(NETWORK_ERROR);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleSection text="signup_with" onCredential={signUpWithGoogle} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label="Seu nome"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          placeholder="Maria das Flores"
          {...field('name')}
        />
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="voce@exemplo.com"
          {...field('email')}
        />
        <Field
          label="WhatsApp"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          enterKeyHint="next"
          placeholder="(41) 99999-9999"
          hint="É para onde chegam os pedidos da sua loja."
          {...field('whatsapp')}
        />
        <PasswordField
          label="Crie uma senha"
          autoComplete="new-password"
          enterKeyHint="next"
          hint={`Pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`}
          {...field('password')}
        />
        <PasswordField
          label="Confirme a senha"
          autoComplete="new-password"
          enterKeyHint="done"
          {...field('confirm')}
        />
        <FormError>{formError}</FormError>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="mt-1 w-full"
        >
          {pending ? <LoaderCircle className="animate-spin" /> : 'Criar conta'}
        </Button>
      </form>
      <LegalNote />
    </div>
  );
}
