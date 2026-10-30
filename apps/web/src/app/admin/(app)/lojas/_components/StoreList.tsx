'use client';

import {
  adminStoresList,
  type AdminStoreListDto,
  type AdminStoreRowDto,
  type AdminStoresListData,
} from '@banquinha/api-client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminPath, formatDate, formatNumber } from '@/lib/admin';
import { panelApi } from '@/lib/panel';
import { cn } from '@/lib/utils';
import {
  ActionsCell,
  DeleteButton,
  Loading,
  PageTitle,
  Pager,
  Pill,
  Table,
} from '../../../_components/admin-ui';
import { DeleteStoreDialog } from './DeleteStoreDialog';

type Filter = NonNullable<NonNullable<AdminStoresListData['query']>['filter']>;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'live', label: 'No ar' },
  { value: 'suspended', label: 'Suspensas' },
  { value: 'examples', label: 'Exemplos' },
];

export function StoreList() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<AdminStoreListDto | null>(null);
  const [deleting, setDeleting] = useState<AdminStoreRowDto | null>(null);
  // Bumped after a deletion to fetch the page again.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Waits for a pause in typing before searching.
    const timer = setTimeout(() => {
      adminStoresList({
        client: panelApi,
        query: { q: q || undefined, filter, page },
      }).then(({ data }) => setList(data ?? null));
    }, 250);
    return () => clearTimeout(timer);
  }, [q, filter, page, version]);

  return (
    <>
      <PageTitle>Lojas</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          placeholder="Endereço, nome, cidade ou e-mail do dono"
          className="h-10 min-w-64 flex-1 rounded-full border bg-surface px-4 text-sm outline-none focus:border-foreground/40"
        />
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
            className={cn(
              'rounded-full border px-3 text-sm',
              filter === option.value
                ? 'bg-ink text-ink-foreground'
                : 'bg-surface hover:bg-muted',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!list ? (
        <Loading />
      ) : (
        <>
          <Table
            head={[
              'Loja',
              'Dono',
              'Cidade',
              'Plano',
              'Itens',
              'Fotos',
              'Pedidos',
              'Último pedido',
              'Criada',
            ]}
            actions
          >
            {list.stores.map((store) => (
              <tr key={store.id} className="hover:bg-muted/50">
                <td className="px-3 py-2">
                  <Link
                    href={adminPath(`/lojas?id=${store.id}`)}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {store.name}
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    /{store.handle}
                    {store.suspendedAt && <Pill tone="danger">suspensa</Pill>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {store.owner ? (
                    <Link
                      href={adminPath(`/contas?id=${store.owner.id}`)}
                      className="underline-offset-2 hover:underline"
                    >
                      {store.owner.email}
                    </Link>
                  ) : (
                    <Pill>exemplo</Pill>
                  )}
                </td>
                <td className="px-3 py-2">{store.city ?? '—'}</td>
                <td className="px-3 py-2">
                  <Pill tone={store.plan === 'free' ? 'muted' : 'lilac'}>
                    {store.plan}
                  </Pill>
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatNumber(store.productCount)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatNumber(store.photoCount)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {formatNumber(store.orderCount)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {store.lastOrderAt ? formatDate(store.lastOrderAt) : '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDate(store.createdAt)}
                </td>
                <ActionsCell>
                  <DeleteButton
                    label={`Apagar /${store.handle}`}
                    onClick={() => setDeleting(store)}
                  />
                </ActionsCell>
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
      {deleting && (
        <DeleteStoreDialog
          store={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setVersion((value) => value + 1);
          }}
        />
      )}
    </>
  );
}
