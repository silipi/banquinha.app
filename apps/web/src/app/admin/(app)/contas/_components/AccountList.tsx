'use client';

import {
  adminAccountsList,
  type AdminAccountListDto,
} from '@banquinha/api-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminPath, formatDate } from '@/lib/admin';
import { panelApi } from '@/lib/panel';
import { cn } from '@/lib/utils';
import {
  Loading,
  PageTitle,
  Pager,
  Pill,
  Table,
} from '../../../_components/admin-ui';
import { PlanPill } from './PlanPill';

export function AccountList() {
  const [q, setQ] = useState('');
  const [comped, setComped] = useState(false);
  const [page, setPage] = useState(1);
  const [list, setList] = useState<AdminAccountListDto | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      adminAccountsList({
        client: panelApi,
        query: { q: q || undefined, comped: comped || undefined, page },
      }).then(({ data }) => setList(data ?? null));
    }, 250);
    return () => clearTimeout(timer);
  }, [q, comped, page]);

  return (
    <>
      <PageTitle>Contas</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          placeholder="E-mail, nome ou WhatsApp"
          className="h-10 min-w-64 flex-1 rounded-full border bg-surface px-4 text-sm outline-none focus:border-foreground/40"
        />
        <button
          type="button"
          onClick={() => {
            setComped((value) => !value);
            setPage(1);
          }}
          className={cn(
            'rounded-full border px-3 text-sm',
            comped ? 'bg-ink text-ink-foreground' : 'bg-surface hover:bg-muted',
          )}
        >
          Só com cortesia
        </button>
      </div>

      {!list ? (
        <Loading />
      ) : (
        <>
          <Table
            head={[
              'Conta',
              'WhatsApp',
              'Entra com',
              'Plano',
              'Lojas',
              'Último login',
              'Criada',
            ]}
          >
            {list.accounts.map((account) => (
              <tr key={account.id} className="hover:bg-muted/50">
                <td className="px-3 py-2">
                  <Link
                    href={adminPath(`/contas?id=${account.id}`)}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {account.email}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {account.name ?? '—'}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {account.whatsapp ?? '—'}
                </td>
                <td className="px-3 py-2">
                  <span className="flex gap-1">
                    {account.signInMethods.map((method) => (
                      <Pill key={method}>
                        {method === 'google' ? 'Google' : 'senha'}
                      </Pill>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <PlanPill plan={account.plan} />
                </td>
                <td className="px-3 py-2 tabular-nums">{account.storeCount}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {account.lastSignInAt
                    ? formatDate(account.lastSignInAt)
                    : '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDate(account.createdAt)}
                </td>
              </tr>
            ))}
          </Table>
          <Pager
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            onPage={setPage}
          />
        </>
      )}
    </>
  );
}
