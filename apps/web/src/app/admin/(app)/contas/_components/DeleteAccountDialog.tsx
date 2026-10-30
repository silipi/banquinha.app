'use client';

import {
  adminAccountsDelete,
  type AdminAccountRowDto,
} from '@banquinha/api-client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { Dialog } from '../../../../painel/_components/Dialog';
import { Field, FormError } from '../../../../painel/_components/fields';
import { refreshStorefront } from '../../../../painel/actions';
import { useAdmin } from '../../_components/admin-context';

type DeletableAccount = Pick<AdminAccountRowDto, 'id' | 'email' | 'storeCount'>;

/** Asks for the email again (and, in production, a fresh authenticator code). */
export function DeleteAccountDialog({
  account,
  onClose,
  onDeleted,
}: {
  account: DeletableAccount;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { environment } = useAdmin();
  const production = environment === 'production';
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready =
    email.trim().toLowerCase() === account.email &&
    (!production || /^\d{6}$/.test(code));

  async function submit() {
    setBusy(true);
    const { data, error: failed } = await adminAccountsDelete({
      client: panelApi,
      path: { id: account.id },
      body: { email, code: production ? code : undefined },
    });
    setBusy(false);
    if (!data) {
      setError(apiErrorMessage(failed, 'Não foi possível apagar.'));
      return;
    }
    await Promise.all(data.storeHandles.map(refreshStorefront));
    onDeleted();
  }

  return (
    <Dialog
      title="Apagar conta"
      onClose={onClose}
      footer={
        <Button
          onClick={submit}
          disabled={busy || !ready}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          Apagar para sempre
        </Button>
      }
    >
      <div className="space-y-4 p-5 text-sm">
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-800">
          {production && <strong>Produção. </strong>}
          Apaga a conta {account.email}
          {account.storeCount > 0
            ? ` e ${account.storeCount} loja(s) dela, com todos os itens, fotos e pedidos`
            : ''}
          . Não tem volta. A pessoa sai do painel na hora e o e-mail fica livre
          para um cadastro novo.
        </p>
        <Field
          label={`Digite ${account.email} para confirmar`}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
        />
        {production && (
          <Field
            label="Código novo do app autenticador"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />
        )}
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
