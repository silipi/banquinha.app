'use client';

import {
  productsList,
  productsReorder,
  type ProductDto,
  type ProductListDto,
} from '@banquinha/api-client';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatItemPrice } from '@/lib/item-price';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { absoluteUrl } from '@/lib/site';
import { productPath } from '@/lib/storefront-links';
import { cn } from '@/lib/utils';
import { refreshStorefront } from '../../actions';
import { usePanel } from '../_components/panel-context';
import { ProductEditor } from './_components/ProductEditor';

async function fetchProducts(
  storeId: string,
): Promise<{ list: ProductListDto } | { error: string }> {
  const { data, error } = await productsList({
    client: panelApi,
    path: { storeId },
  });
  return data
    ? { list: data }
    : { error: apiErrorMessage(error, 'Não deu para carregar.') };
}

export default function ProductsPage() {
  const { me, store } = usePanel();
  const [list, setList] = useState<ProductListDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // null: closed. 'new': creating. Otherwise the product being edited.
  const [editing, setEditing] = useState<ProductDto | 'new' | null>(null);
  const [moving, setMoving] = useState(false);

  const storeId = store?.id;

  const load = useCallback(async () => {
    if (!storeId) return;
    try {
      const result = await fetchProducts(storeId);
      if ('list' in result) setList(result.list);
      else setLoadError(result.error);
    } catch {
      setLoadError('Sem conexão com a internet? Recarregue a página.');
    }
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    fetchProducts(storeId)
      .then((result) =>
        'list' in result ? setList(result.list) : setLoadError(result.error),
      )
      .catch(() =>
        setLoadError('Sem conexão com a internet? Recarregue a página.'),
      );
  }, [storeId]);

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

  const { products, maxProducts } = list;
  const atLimit = products.length >= maxProducts;

  /** After any change: fresh list here and on the storefront. */
  async function changed() {
    await load();
    await refreshStorefront(store!.handle).catch(() => {});
  }

  async function move(index: number, by: -1 | 1) {
    const order = products.map((p) => p.id);
    const [id] = order.splice(index, 1);
    order.splice(index + by, 0, id!);
    // Moves right away; the server's answer replaces it.
    setList({
      ...list!,
      products: order.map((id) => products.find((p) => p.id === id)!),
    });
    setMoving(true);
    try {
      const { data, error } = await productsReorder({
        client: panelApi,
        path: { storeId: store!.id },
        body: { productIds: order },
      });
      if (data) {
        setList(data);
        await refreshStorefront(store!.handle).catch(() => {});
      } else {
        setLoadError(apiErrorMessage(error, 'Não deu para reordenar.'));
        await load();
      }
    } catch {
      await load();
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Produtos e serviços
          </h1>
          <p className="mt-1 text-muted-foreground">
            {products.length} de {maxProducts} no plano {me.plan.name}
          </p>
        </div>
        <Button
          variant="brand"
          disabled={atLimit}
          onClick={() => setEditing('new')}
        >
          <Plus /> Novo item
        </Button>
      </header>

      {atLimit && (
        <p className="rounded-2xl bg-butter px-4 py-3 text-sm">
          Você chegou ao limite de {maxProducts} itens do plano {me.plan.name}.
          Apague um para cadastrar outro.
        </p>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed p-10 text-center">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="font-medium">
            Sua loja ainda não tem produtos nem serviços
          </p>
          <Button variant="brand" onClick={() => setEditing('new')}>
            <Plus /> Cadastrar o primeiro
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" aria-busy={moving}>
          {products.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border bg-surface p-2 pr-3"
            >
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
              >
                <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt=""
                      fill
                      sizes="64px"
                      className={cn(
                        'object-cover',
                        !product.active && 'opacity-50',
                      )}
                    />
                  ) : (
                    <ImageIcon className="size-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {product.name}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {formatItemPrice(product)}
                    {product.kind === 'service' && (
                      <span className="rounded-full bg-sky px-2 py-0.5 text-xs text-ink">
                        Serviço
                      </span>
                    )}
                    {!product.active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        Escondido
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 items-center">
                {product.active && (
                  <a
                    href={absoluteUrl(productPath(store.handle, product.slug))}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver ${product.name} na loja`}
                    className="hidden size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0 || moving}
                  aria-label={`Subir ${product.name}`}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void move(index, 1)}
                  disabled={index === products.length - 1 || moving}
                  aria-label={`Descer ${product.name}`}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProductEditor
          key={editing === 'new' ? 'new' : editing.id}
          storeId={store.id}
          product={editing === 'new' ? null : editing}
          maxImages={list.maxImagesPerProduct}
          onSaved={changed}
          onDeleted={changed}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
