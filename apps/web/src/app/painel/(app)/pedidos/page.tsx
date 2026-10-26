'use client';

import {
  ordersGet,
  ordersList,
  ordersUpdate,
  type OrderDto,
  type OrderListDto,
  type OrderSummaryDto,
} from '@banquinha/api-client';
import {
  Bike,
  Check,
  Copy,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Receipt,
  Store,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { storePath } from '@/lib/storefront-links';
import { cn, formatBRL } from '@/lib/utils';
import { formatWhatsappInput } from '@/lib/whatsapp-input';
import { Dialog } from '../../_components/Dialog';
import { FormError } from '../../_components/fields';
import { usePanel } from '../_components/panel-context';

type Status = OrderSummaryDto['status'];

const STATUS: Record<Status, { label: string; badge: string }> = {
  new: { label: 'Novo', badge: 'bg-brand text-brand-foreground' },
  confirmed: { label: 'Confirmado', badge: 'bg-sky text-ink' },
  completed: { label: 'Concluído', badge: 'bg-sage text-ink' },
  canceled: { label: 'Cancelado', badge: 'bg-muted text-muted-foreground' },
};

const FILTERS: { status: Status | null; label: string }[] = [
  { status: null, label: 'Todos' },
  { status: 'new', label: 'Novos' },
  { status: 'confirmed', label: 'Confirmados' },
  { status: 'completed', label: 'Concluídos' },
  { status: 'canceled', label: 'Cancelados' },
];

/** What the merchant usually does next with an order in each status. */
const NEXT: Record<Status, { status: Status; label: string }[]> = {
  new: [
    { status: 'confirmed', label: 'Confirmar pedido' },
    { status: 'canceled', label: 'Cancelar' },
  ],
  confirmed: [
    { status: 'completed', label: 'Marcar como concluído' },
    { status: 'canceled', label: 'Cancelar' },
  ],
  completed: [{ status: 'confirmed', label: 'Reabrir' }],
  canceled: [{ status: 'new', label: 'Reabrir' }],
};

type CustomerLinks = NonNullable<OrderDto['customerLinks']>;
type MessageKey = Exclude<keyof CustomerLinks, 'chat'>;

/** The ready messages, in the order they usually go out. */
function messageLabels(order: OrderDto): { key: MessageKey; label: string }[] {
  return [
    { key: 'confirmed', label: 'Pedido confirmado' },
    {
      key: 'ready',
      label:
        order.fulfillment === 'delivery'
          ? 'Saiu para entrega'
          : 'Pronto para retirada',
    },
    { key: 'completed', label: 'Obrigado pela compra' },
    { key: 'canceled', label: 'Pedido cancelado' },
  ];
}

/** The message offered right after the merchant moves an order to a status. */
const STATUS_MESSAGE: Partial<Record<Status, MessageKey>> = {
  confirmed: 'confirmed',
  completed: 'completed',
  canceled: 'canceled',
};

const time = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});
const day = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});

/** "hoje, 14:32", "ontem, 09:10" or "12/10, 14:32". */
function orderDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const label = same(date, today)
    ? 'hoje'
    : same(date, yesterday)
      ? 'ontem'
      : day.format(date);
  return `${label}, ${time.format(date)}`;
}

async function fetchOrders(
  storeId: string,
  status: Status | null,
  before?: number,
): Promise<OrderListDto> {
  const { data, error } = await ordersList({
    client: panelApi,
    path: { storeId },
    query: { status: status ?? undefined, before },
  });
  if (!data) throw new Error(apiErrorMessage(error, 'Não deu para carregar.'));
  return data;
}

export default function OrdersPage() {
  const { store, setStore } = usePanel();
  const storeId = store?.id;
  const [filter, setFilter] = useState<Status | null>(null);
  const [list, setList] = useState<OrderListDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let current = true;
    fetchOrders(storeId, filter)
      .then((data) => current && setList(data))
      .catch((error: Error) => current && setLoadError(error.message));
    return () => {
      current = false;
    };
  }, [storeId, filter]);

  if (!store || !list) {
    return loadError ? (
      <p className="text-muted-foreground">{loadError}</p>
    ) : (
      <LoaderCircle
        className="size-6 animate-spin text-muted-foreground"
        aria-label="Carregando"
      />
    );
  }

  const total = Object.values(list.counts).reduce((a, b) => a + b, 0);

  async function loadMore() {
    if (!list?.nextBefore) return;
    setLoadingMore(true);
    try {
      const next = await fetchOrders(store!.id, filter, list.nextBefore);
      setList({ ...next, orders: [...list.orders, ...next.orders] });
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  /** After a status change: update the row, the counts and the sidebar badge. */
  function updated(order: OrderDto) {
    setList((current) => {
      if (!current) return current;
      const previous = current.orders.find((o) => o.id === order.id);
      const counts = { ...current.counts };
      if (previous) {
        counts[previous.status] -= 1;
        counts[order.status] += 1;
      }
      return {
        ...current,
        counts,
        // A row that no longer matches the filter leaves the list.
        orders: current.orders
          .map((o) => (o.id === order.id ? { ...o, status: order.status } : o))
          .filter((o) => !filter || o.status === filter),
      };
    });
    const previous = list!.orders.find((o) => o.id === order.id);
    if (previous && previous.status !== order.status) {
      const delta =
        (order.status === 'new' ? 1 : 0) - (previous.status === 'new' ? 1 : 0);
      if (delta) {
        setStore({ ...store!, newOrderCount: store!.newOrderCount + delta });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Pedidos
        </h1>
        <p className="mt-1 text-muted-foreground">
          Os pedidos feitos na sua loja. O cliente também te chama no WhatsApp
          para combinar o pagamento e a entrega, e você pode avisar cada passo
          com uma mensagem pronta.
        </p>
      </header>

      {total === 0 ? (
        <EmptyOrders handle={store.handle} />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Filtrar pedidos"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          >
            {FILTERS.map(({ status, label }) => {
              const count = status ? list.counts[status] : total;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={filter === status}
                  onClick={() => {
                    setList(null);
                    setFilter(status);
                  }}
                  className={cn(
                    'flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-surface px-4 text-sm font-medium transition-colors hover:bg-muted',
                    filter === status &&
                      'border-ink bg-ink text-ink-foreground hover:bg-ink',
                  )}
                >
                  {label}
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {list.orders.length === 0 ? (
            <p className="rounded-3xl border border-dashed p-8 text-center text-muted-foreground">
              Nenhum pedido aqui.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {list.orders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(order.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border bg-surface p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">#{order.number}</span>
                        <span className="truncate">{order.customerName}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        {orderDate(order.createdAt)}
                        <span aria-hidden>·</span>
                        {order.fulfillment === 'delivery'
                          ? 'Entrega'
                          : 'Retirada'}
                        <span aria-hidden>·</span>
                        {order.itemCount}{' '}
                        {order.itemCount === 1 ? 'item' : 'itens'}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-medium tabular-nums">
                        {formatBRL(order.totalCents / 100)}
                      </span>
                      <StatusBadge status={order.status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {list.nextBefore && (
            <Button
              variant="outline"
              className="self-center"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore && <LoaderCircle className="animate-spin" />}
              Ver mais pedidos
            </Button>
          )}
        </>
      )}

      {openId && (
        <OrderDetail
          storeId={store.id}
          orderId={openId}
          onUpdated={updated}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function CustomerContact({ order }: { order: OrderDto }) {
  if (!order.customerWhatsapp || !order.customerLinks) {
    return (
      <p className="text-sm text-muted-foreground">
        Pedido feito antes da loja pedir o WhatsApp do cliente. Procure a
        conversa no seu WhatsApp pelo nome.
      </p>
    );
  }
  const links = order.customerLinks;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm">
          <span className="block text-xs text-muted-foreground">WhatsApp</span>
          <span className="font-medium tabular-nums">
            {formatWhatsappInput(order.customerWhatsapp)}
          </span>
        </span>
        <a
          href={links.chat}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'bg-whatsapp text-white hover:bg-whatsapp/90',
          )}
        >
          <MessageCircle /> Falar com o cliente
        </a>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Mensagens prontas (abrem no WhatsApp para você revisar e enviar)
        </p>
        <div className="flex flex-wrap gap-2">
          {messageLabels(order).map(({ key, label }) => (
            <a
              key={key}
              href={links[key]}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuggestedMessage({
  label,
  customerName,
  href,
  onDone,
}: {
  label: string;
  customerName: string;
  href: string;
  onDone: () => void;
}) {
  const firstName = customerName.trim().split(/\s+/)[0];
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl bg-sage px-4 py-3 text-ink"
    >
      <p className="min-w-0 flex-1 text-sm">
        Avisar {firstName} no WhatsApp?
        <span className="block text-xs opacity-70">“{label}”</span>
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onDone}
        className={cn(
          buttonVariants({ size: 'sm' }),
          'bg-whatsapp text-white hover:bg-whatsapp/90',
        )}
      >
        <MessageCircle /> Avisar
      </a>
      <button
        type="button"
        onClick={onDone}
        aria-label="Agora não"
        className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-ink/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS[status].badge,
      )}
    >
      {STATUS[status].label}
    </span>
  );
}

function EmptyOrders({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(storePath(handle));
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed p-10 text-center">
      <Receipt className="size-8 text-muted-foreground" />
      <p className="font-medium">Nenhum pedido ainda</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Quando alguém pedir pela sua loja, o pedido aparece aqui. Divulgue o
        link no Instagram e no WhatsApp para começar.
      </p>
      <Button
        variant="brand"
        onClick={() => {
          navigator.clipboard
            .writeText(url)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {});
        }}
      >
        {copied ? <Check /> : <Copy />}
        {copied ? 'Link copiado' : 'Copiar link da loja'}
      </Button>
    </div>
  );
}

function OrderDetail({
  storeId,
  orderId,
  onUpdated,
  onClose,
}: {
  storeId: string;
  orderId: string;
  onUpdated: (order: OrderDto) => void;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Status | null>(null);
  /** Set after a status change that has a message to send the customer. */
  const [suggested, setSuggested] = useState<MessageKey | null>(null);

  useEffect(() => {
    ordersGet({ client: panelApi, path: { storeId, orderId } })
      .then(({ data, error }) =>
        data
          ? setOrder(data)
          : setError(apiErrorMessage(error, 'Não deu para abrir o pedido.')),
      )
      .catch(() => setError('Sem conexão com a internet? Tente de novo.'));
  }, [storeId, orderId]);

  async function setStatus(status: Status) {
    setSaving(status);
    setError(null);
    try {
      const { data, error } = await ordersUpdate({
        client: panelApi,
        path: { storeId, orderId },
        body: { status },
      });
      if (!data) {
        setError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      setOrder(data);
      onUpdated(data);
      setSuggested(STATUS_MESSAGE[status] ?? null);
    } catch {
      setError('Sem conexão com a internet? Tente de novo.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog
      title={order ? `Pedido #${order.number}` : 'Pedido'}
      onClose={onClose}
      footer={
        order &&
        NEXT[order.status].map((action, index) => (
          <Button
            key={action.status}
            variant={index === 0 ? 'brand' : 'ghost'}
            className={index === 0 ? 'ml-auto' : undefined}
            disabled={saving !== null}
            onClick={() => void setStatus(action.status)}
          >
            {saving === action.status && (
              <LoaderCircle className="animate-spin" />
            )}
            {action.label}
          </Button>
        ))
      }
    >
      {!order ? (
        <div className="flex justify-center p-10">
          {error ? (
            <FormError>{error}</FormError>
          ) : (
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold">
                {order.customerName}
              </p>
              <p className="text-sm text-muted-foreground">
                {orderDate(order.createdAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {order.customerLinks && suggested && (
            <SuggestedMessage
              label={
                messageLabels(order).find(({ key }) => key === suggested)!.label
              }
              customerName={order.customerName}
              href={order.customerLinks[suggested]}
              onDone={() => setSuggested(null)}
            />
          )}

          <CustomerContact order={order} />

          <section className="rounded-2xl border bg-surface">
            <ul className="divide-y">
              {order.items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-baseline justify-between gap-3 px-4 py-3"
                >
                  <span>
                    <span className="font-medium tabular-nums">
                      {item.quantity}×
                    </span>{' '}
                    {item.name}
                    <span className="block text-xs text-muted-foreground">
                      {formatBRL(item.unitPriceCents / 100)} cada
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatBRL((item.unitPriceCents * item.quantity) / 100)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t px-4 py-3 font-display text-lg font-bold">
              Total{' '}
              <span className="tabular-nums">
                {formatBRL(order.totalCents / 100)}
              </span>
            </p>
          </section>

          <section className="flex flex-col gap-3 text-sm">
            <p className="flex items-start gap-3">
              {order.fulfillment === 'delivery' ? (
                <Bike className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Store className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                <span className="block font-medium">
                  {order.fulfillment === 'delivery' ? 'Entrega' : 'Retirada'}
                </span>
                {order.address && (
                  <span className="text-muted-foreground">{order.address}</span>
                )}
              </span>
            </p>
            {order.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 font-medium underline-offset-4 hover:underline"
              >
                <MapPin className="size-4" /> Abrir endereço no mapa
              </a>
            )}
            {order.note && (
              <p className="rounded-2xl bg-butter px-4 py-3">
                <span className="block text-xs font-medium">Observação</span>
                {order.note}
              </p>
            )}
          </section>

          <FormError>{order && error}</FormError>
        </div>
      )}
    </Dialog>
  );
}
