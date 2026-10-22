'use client';

import { ArrowLeft, MessageCircle, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { productPath, storePath } from '@/lib/storefront-links';
import { cn, formatBRL } from '@/lib/utils';
import {
  MAX_ITEM_QUANTITY,
  useCart,
  type CartItem,
} from '../_components/use-cart';
import { placeOrder } from './actions';

type Fulfillment = 'pickup' | 'delivery';

const field =
  'w-full rounded-2xl border bg-surface px-4 py-3 outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-store';

export function BagView() {
  const cart = useCart();
  const [placed, setPlaced] = useState<{
    number: number;
    whatsappUrl: string;
  }>();

  if (placed) return <OrderPlaced {...placed} handle={cart.handle} />;

  return (
    <>
      <Link
        href={storePath(cart.handle)}
        className="inline-flex items-center gap-2 rounded-full py-2 pr-4 pl-2 text-sm font-medium transition-colors hover:bg-store-soft"
      >
        <ArrowLeft className="size-4" /> Continuar comprando
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
        Sua sacola
      </h1>

      {cart.items === null ? (
        <div className="mt-8 h-28 animate-pulse rounded-3xl bg-muted" />
      ) : cart.items.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-store-soft p-10 text-center">
          <p className="text-muted-foreground">Sua sacola está vazia.</p>
          <Link
            href={storePath(cart.handle)}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-store px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y rounded-3xl border bg-surface">
            {cart.items.map((item) => (
              <BagItem
                key={item.slug}
                item={item}
                handle={cart.handle}
                onQuantityChange={(quantity) =>
                  cart.setQuantity(item.slug, quantity)
                }
                onRemove={() => cart.remove([item.slug])}
              />
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between px-2 text-lg">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold">
              {formatBRL(cart.subtotalCents / 100)}
            </span>
          </div>
          <CheckoutForm
            onPlaced={(order) => {
              cart.clear();
              setPlaced(order);
              window.location.assign(order.whatsappUrl);
            }}
          />
        </>
      )}
    </>
  );
}

function BagItem({
  item,
  handle,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  handle: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const stepper =
    'flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-40 [&_svg]:size-4';

  return (
    <li className="flex gap-4 p-4">
      <Link
        href={productPath(handle, item.slug)}
        className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-store-soft"
      >
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium">{item.name}</p>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${item.name}`}
            className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded-full border">
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Diminuir quantidade"
              className={stepper}
            >
              <Minus />
            </button>
            <span className="w-7 text-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= MAX_ITEM_QUANTITY}
              aria-label="Aumentar quantidade"
              className={stepper}
            >
              <Plus />
            </button>
          </div>
          <p className="font-medium">
            {formatBRL((item.priceCents * item.quantity) / 100)}
          </p>
        </div>
      </div>
    </li>
  );
}

function CheckoutForm({
  onPlaced,
}: {
  onPlaced: (order: { number: number; whatsappUrl: string }) => void;
}) {
  const cart = useCart();
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim();

    setError(undefined);
    startTransition(async () => {
      const result = await placeOrder(cart.handle, {
        customerName: text('customerName'),
        fulfillment,
        address: fulfillment === 'delivery' ? text('address') : undefined,
        note: text('note') || undefined,
        items: (cart.items ?? []).map(({ slug, quantity }) => ({
          slug,
          quantity,
        })),
      });

      if (result.ok) {
        onPlaced(result);
        return;
      }
      if (result.unavailableSlugs?.length) cart.remove(result.unavailableSlugs);
      setError(result.message);
    });
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-6">
      <h2 className="font-display text-2xl font-bold">Seus dados</h2>

      <label className="block">
        <span className="mb-2 block text-sm font-medium">Seu nome</span>
        <input
          name="customerName"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="Como a loja vai te chamar"
          className={field}
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Como prefere receber?
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['pickup', 'Vou retirar'],
              ['delivery', 'Quero entrega'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                'flex h-12 cursor-pointer items-center justify-center rounded-full border bg-surface text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-store',
                fulfillment === value && 'border-store bg-store-soft',
              )}
            >
              <input
                type="radio"
                name="fulfillment"
                value={value}
                checked={fulfillment === value}
                onChange={() => setFulfillment(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {fulfillment === 'delivery' && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Endereço de entrega
          </span>
          <textarea
            name="address"
            required
            minLength={5}
            maxLength={300}
            rows={2}
            autoComplete="street-address"
            placeholder="Rua, número, bairro e complemento"
            className={field}
          />
        </label>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-medium">
          Observação <span className="text-muted-foreground">(opcional)</span>
        </span>
        <textarea
          name="note"
          maxLength={500}
          rows={2}
          placeholder="Algum detalhe para a loja?"
          className={field}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-brand-soft px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-7 font-medium text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          <MessageCircle className="size-5" />
          {pending ? 'Enviando…' : 'Enviar pedido pelo WhatsApp'}
        </button>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Você combina o pagamento e a entrega direto com a loja.
        </p>
      </div>
    </form>
  );
}

function OrderPlaced({
  number,
  whatsappUrl,
  handle,
}: {
  number: number;
  whatsappUrl: string;
  handle: string;
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-whatsapp text-white">
        <MessageCircle className="size-8" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
        Pedido #{number} criado!
      </h1>
      <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
        Agora é só enviar a mensagem no WhatsApp para a loja confirmar. Se ele
        não abriu sozinho, toque no botão abaixo.
      </p>
      <a
        href={whatsappUrl}
        className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-whatsapp px-7 font-medium text-white transition-opacity hover:opacity-90"
      >
        <MessageCircle className="size-5" /> Abrir WhatsApp
      </a>
      <Link
        href={storePath(handle)}
        className="mt-4 text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Voltar para a loja
      </Link>
    </div>
  );
}
