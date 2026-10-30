'use client';

import {
  adminAccountsGet,
  adminAccountsRemovePlanOverride,
  adminAccountsSetPlanOverride,
  type AdminAccountDto,
  type SetPlanOverrideDto,
} from '@banquinha/api-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminPath, formatDate, formatDateTime } from '@/lib/admin';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { Field, FormError } from '../../../../painel/_components/fields';
import { refreshStorefront } from '../../../../painel/actions';
import {
  Loading,
  PageTitle,
  Pill,
  Section,
} from '../../../_components/admin-ui';
import { AuditList } from '../../_components/AuditList';
import { PlanPill } from './PlanPill';

const PLAN_OPTIONS: { value: SetPlanOverrideDto['plan']; label: string }[] = [
  { value: 'pro', label: 'Pro' },
  { value: 'free', label: 'Grátis' },
];

export function AccountDetail({ id }: { id: string }) {
  const [account, setAccount] = useState<AdminAccountDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAccountsGet({ client: panelApi, path: { id } }).then(
      ({ data, error: failed }) => {
        if (data) setAccount(data);
        else setError(apiErrorMessage(failed, 'Não foi possível carregar.'));
      },
    );
  }, [id]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!account) return <Loading />;

  // The plan changes what the storefronts show (custom fields within the limit).
  async function changed(next: AdminAccountDto) {
    setAccount(next);
    await Promise.all(
      next.stores.map((store) => refreshStorefront(store.handle)),
    );
  }

  return (
    <>
      <p className="mb-2 text-sm">
        <Link
          href={adminPath('/contas')}
          className="text-muted-foreground hover:underline"
        >
          ← Contas
        </Link>
      </p>
      <PageTitle aside={<PlanPill plan={account.plan} />}>
        {account.email}
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Conta">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Nome</dt>
            <dd>{account.name ?? '—'}</dd>
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd>{account.whatsapp ?? '—'}</dd>
            <dt className="text-muted-foreground">Entra com</dt>
            <dd>
              {account.signInMethods
                .map((method) => (method === 'google' ? 'Google' : 'senha'))
                .join(' e ')}
            </dd>
            <dt className="text-muted-foreground">Criada</dt>
            <dd>{formatDateTime(account.createdAt)}</dd>
            <dt className="text-muted-foreground">Último login</dt>
            <dd>
              {account.lastSignInAt
                ? formatDateTime(account.lastSignInAt)
                : '—'}
            </dd>
            <dt className="text-muted-foreground">Lojas</dt>
            <dd className="flex flex-col">
              {account.stores.length === 0 && 'Nenhuma (onboarding parado)'}
              {account.stores.map((store) => (
                <Link
                  key={store.id}
                  href={adminPath(`/lojas?id=${store.id}`)}
                  className="hover:underline"
                >
                  {store.name} · /{store.handle}{' '}
                  {store.suspendedAt && <Pill tone="danger">suspensa</Pill>}
                </Link>
              ))}
            </dd>
          </dl>
        </Section>
        <PlanSection account={account} onChange={changed} />
      </div>

      <Section title="Histórico no admin" className="mt-6">
        <AuditList entries={account.audit} />
      </Section>
    </>
  );
}

function PlanSection({
  account,
  onChange,
}: {
  account: AdminAccountDto;
  onChange: (account: AdminAccountDto) => Promise<void>;
}) {
  const { plan } = account;
  const [choice, setChoice] = useState<SetPlanOverrideDto['plan']>(
    plan.override ?? 'pro',
  );
  const [until, setUntil] = useState(
    plan.overrideExpiresAt?.slice(0, 10) ?? '',
  );
  const [reason, setReason] = useState(plan.overrideReason ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const { data, error: failed } = await adminAccountsSetPlanOverride({
      client: panelApi,
      path: { id: account.id },
      body: {
        plan: choice,
        // End of that day in São Paulo.
        expiresAt: until ? `${until}T23:59:59-03:00` : null,
        reason,
      },
    });
    setBusy(false);
    if (data) await onChange(data);
    else setError(apiErrorMessage(failed, 'Não foi possível salvar.'));
  }

  async function remove() {
    setBusy(true);
    const { data } = await adminAccountsRemovePlanOverride({
      client: panelApi,
      path: { id: account.id },
    });
    setBusy(false);
    if (data) await onChange(data);
  }

  return (
    <Section title="Plano">
      <p className="mb-3 text-sm">
        Pago: <strong>{plan.paid}</strong> · Em vigor:{' '}
        <strong>{plan.effective}</strong>
        {plan.override && (
          <>
            <br />
            Cortesia {plan.override}
            {plan.overrideExpiresAt
              ? ` até ${formatDate(plan.overrideExpiresAt)}`
              : ' sem prazo'}
            {!plan.overrideActive && ' (vencida)'}: {plan.overrideReason}
          </>
        )}
      </p>
      <div className="space-y-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Dar o plano
          <select
            value={choice}
            onChange={(event) =>
              setChoice(event.target.value as SetPlanOverrideDto['plan'])
            }
            className="h-11 rounded-2xl border bg-surface px-3 text-base"
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Até (vazio = sem prazo)"
          type="date"
          value={until}
          onChange={(event) => setUntil(event.target.value)}
        />
        <Field
          label="Motivo"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Amiga, parceria, teste…"
          maxLength={500}
        />
        <FormError>{error}</FormError>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={save}
            disabled={busy || reason.trim().length < 3}
          >
            {plan.override ? 'Atualizar cortesia' : 'Dar cortesia'}
          </Button>
          {plan.override && (
            <Button
              size="sm"
              variant="outline"
              onClick={remove}
              disabled={busy}
            >
              Tirar cortesia
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
