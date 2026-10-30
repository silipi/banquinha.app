'use client';

import {
  adminStoresDelete,
  type AdminStoreRowDto,
} from '@banquinha/api-client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { Dialog } from '../../../../painel/_components/Dialog';
import { Field, FormError } from '../../../../painel/_components/fields';
import { refreshStorefront } from '../../../../painel/actions';
import { useAdmin } from '../../_components/admin-context';

type DeletableStore = Pick<
  AdminStoreRowDto,
  'id' | 'handle' | 'productCount' | 'photoCount' | 'orderCount'
>;

/** Asks for the handle again (and, in production, a fresh authenticator code). */
export function DeleteStoreDialog({
  store,
  onClose,
  onDeleted,
}: {
  store: DeletableStore;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { environment } = useAdmin();
  const production = environment === 'production';
  const [handle, setHandle] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready =
    handle.trim().toLowerCase() === store.handle &&
    (!production || /^\d{6}$/.test(code));

  async function submit() {
    setBusy(true);
    const { data, error: failed } = await adminStoresDelete({
      client: panelApi,
      path: { id: store.id },
      body: { handle, code: production ? code : undefined },
    });
    setBusy(false);
    if (!data) {
      setError(apiErrorMessage(failed, 'Não foi possível apagar.'));
      return;
    }
    await refreshStorefront(data.handle);
    onDeleted();
  }

  return (
    <Dialog
      title={`Apagar /${store.handle}`}
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
          Apaga a loja, {store.productCount} item(ns), {store.photoCount}{' '}
          foto(s) e {store.orderCount} pedido(s). Não tem volta. A conta do dono
          continua existindo e o endereço fica livre.
        </p>
        <Field
          label={`Digite ${store.handle} para confirmar`}
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
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
