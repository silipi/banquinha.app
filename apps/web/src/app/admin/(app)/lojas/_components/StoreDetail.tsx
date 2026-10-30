'use client';

import {
  adminStoresGet,
  adminStoresSuspend,
  adminStoresUnsuspend,
  type AdminStoreDto,
} from '@banquinha/api-client';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  adminPath,
  formatDate,
  formatDateTime,
  formatNumber,
} from '@/lib/admin';
import { formatItemPrice, formatTotal } from '@/lib/item-price';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { storePath } from '@/lib/storefront-links';
import { Dialog } from '../../../../painel/_components/Dialog';
import { Field, FormError } from '../../../../painel/_components/fields';
import { refreshStorefront } from '../../../../painel/actions';
import {
  BarList,
  Loading,
  PageTitle,
  Pill,
  Section,
  Stat,
  Table,
} from '../../../_components/admin-ui';
import { AuditList } from '../../_components/AuditList';
import { DeleteStoreDialog } from './DeleteStoreDialog';

export function StoreDetail({ id }: { id: string }) {
  const router = useRouter();
  const [store, setStore] = useState<AdminStoreDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'suspend' | 'delete' | null>(null);

  useEffect(() => {
    adminStoresGet({ client: panelApi, path: { id } }).then(
      ({ data, error: failed }) => {
        if (data) setStore(data);
        else setError(apiErrorMessage(failed, 'Não foi possível carregar.'));
      },
    );
  }, [id]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!store) return <Loading />;

  async function unsuspend() {
    const { data } = await adminStoresUnsuspend({
      client: panelApi,
      path: { id },
    });
    if (data) {
      setStore(data);
      await refreshStorefront(data.handle);
    }
  }

  const plan = store.planDetails;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link
          href={adminPath('/lojas')}
          className="text-muted-foreground hover:underline"
        >
          ← Lojas
        </Link>
      </p>
      <PageTitle
        aside={
          <div className="flex flex-wrap gap-2">
            {store.suspendedAt ? (
              <Button size="sm" variant="outline" onClick={unsuspend}>
                Reativar loja
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialog('suspend')}
              >
                Suspender
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setDialog('delete')}
            >
              Apagar loja
            </Button>
          </div>
        }
      >
        {store.name}{' '}
        <a
          href={absoluteUrl(storePath(store.handle))}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 align-middle text-base font-normal text-muted-foreground hover:underline"
        >
          /{store.handle}
          <ExternalLink className="size-3.5" />
        </a>
      </PageTitle>

      {store.suspendedAt && (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Suspensa em {formatDateTime(store.suspendedAt)}:{' '}
          {store.suspensionReason}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Itens" value={formatNumber(store.productCount)} />
        <Stat label="Fotos" value={formatNumber(store.photoCount)} />
        <Stat
          label="Pedidos"
          value={formatNumber(store.orderCount)}
          hint={
            store.lastOrderAt
              ? `Último em ${formatDate(store.lastOrderAt)}`
              : undefined
          }
        />
        <Stat
          label="Plano"
          value={store.plan}
          hint={
            plan?.override
              ? `Cortesia ${plan.override}${plan.overrideExpiresAt ? ` até ${formatDate(plan.overrideExpiresAt)}` : ''}${plan.overrideActive ? '' : ' (vencida)'}`
              : undefined
          }
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="Loja">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Dono</dt>
            <dd>
              {store.owner ? (
                <Link
                  href={adminPath(`/contas?id=${store.owner.id}`)}
                  className="hover:underline"
                >
                  {store.owner.name ?? '—'} · {store.owner.email}
                </Link>
              ) : (
                'Loja de exemplo (sem dono)'
              )}
            </dd>
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd>{store.whatsapp}</dd>
            <dt className="text-muted-foreground">Instagram</dt>
            <dd>{store.instagram ? `@${store.instagram}` : '—'}</dd>
            <dt className="text-muted-foreground">Cidade</dt>
            <dd>{store.city ?? '—'}</dd>
            <dt className="text-muted-foreground">Atende</dt>
            <dd>{store.serviceArea ?? '—'}</dd>
            <dt className="text-muted-foreground">Tema</dt>
            <dd>{store.themeName}</dd>
            <dt className="text-muted-foreground">Logo / capa</dt>
            <dd>
              {store.logoUrl ? 'sim' : 'não'} /{' '}
              {store.bannerUrl ? 'sim' : 'não'}
            </dd>
            <dt className="text-muted-foreground">Campos</dt>
            <dd>{store.fieldCount}</dd>
            <dt className="text-muted-foreground">Criada</dt>
            <dd>{formatDateTime(store.createdAt)}</dd>
            <dt className="text-muted-foreground">Descrição</dt>
            <dd className="whitespace-pre-line">{store.bio ?? '—'}</dd>
          </dl>
        </Section>
        <Section title="Pedidos por status">
          <BarList rows={store.ordersByStatus} empty="Nenhum pedido" />
        </Section>
      </div>

      <h2 className="mt-6 mb-2 font-semibold">Itens</h2>
      <Table head={['Nome', 'Tipo', 'Preço', 'Fotos', 'Situação']}>
        {store.products.map((product) => (
          <tr key={product.id}>
            <td className="px-3 py-2">{product.name}</td>
            <td className="px-3 py-2">
              {product.kind === 'service' ? 'Serviço' : 'Produto'}
            </td>
            <td className="px-3 py-2 whitespace-nowrap">
              {formatItemPrice(product)}
            </td>
            <td className="px-3 py-2 tabular-nums">{product.photoCount}</td>
            <td className="px-3 py-2">
              {product.active ? 'Ativo' : <Pill>inativo</Pill>}
            </td>
          </tr>
        ))}
      </Table>

      <h2 className="mt-6 mb-2 font-semibold">Pedidos recentes</h2>
      {store.recentOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pedido</p>
      ) : (
        <Table head={['#', 'Data', 'Status', 'Entrega', 'Itens', 'Total']}>
          {store.recentOrders.map((order) => (
            <tr key={order.id}>
              <td className="px-3 py-2 tabular-nums">{order.number}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatDateTime(order.createdAt)}
              </td>
              <td className="px-3 py-2">{order.status}</td>
              <td className="px-3 py-2">{order.fulfillment}</td>
              <td className="px-3 py-2 tabular-nums">{order.itemCount}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatTotal(order.totalCents, order.priceToConfirm)}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Section title="Histórico no admin" className="mt-6">
        <AuditList entries={store.audit} />
      </Section>

      {dialog === 'suspend' && (
        <SuspendDialog
          store={store}
          onClose={() => setDialog(null)}
          onDone={setStore}
        />
      )}
      {dialog === 'delete' && (
        <DeleteStoreDialog
          store={store}
          onClose={() => setDialog(null)}
          onDeleted={() => router.replace(adminPath('/lojas'))}
        />
      )}
    </>
  );
}

function SuspendDialog({
  store,
  onClose,
  onDone,
}: {
  store: AdminStoreDto;
  onClose: () => void;
  onDone: (store: AdminStoreDto) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { data, error: failed } = await adminStoresSuspend({
      client: panelApi,
      path: { id: store.id },
      body: { reason },
    });
    setBusy(false);
    if (!data) {
      setError(apiErrorMessage(failed, 'Não foi possível suspender.'));
      return;
    }
    await refreshStorefront(data.handle);
    onDone(data);
    onClose();
  }

  return (
    <Dialog
      title={`Suspender /${store.handle}`}
      onClose={onClose}
      footer={
        <Button onClick={submit} disabled={busy || reason.trim().length < 3}>
          Suspender
        </Button>
      }
    >
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted-foreground">
          A vitrine sai do ar (como se não existisse), novos pedidos são
          recusados e a loja some do sitemap. O lojista continua entrando no
          painel e vê um aviso. Dá para reativar depois.
        </p>
        <Field
          label="Motivo (só aparece aqui no admin)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
        />
        <FormError>{error}</FormError>
      </div>
    </Dialog>
  );
}
