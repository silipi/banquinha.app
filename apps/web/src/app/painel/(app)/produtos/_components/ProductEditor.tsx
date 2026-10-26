'use client';

import {
  productsAddImage,
  productsCreate,
  productsRemove,
  productsRemoveImage,
  productsReorderImages,
  productsUpdate,
  type ProductDto,
  type StoreFieldDto,
} from '@banquinha/api-client';
import { ImagePlus, LoaderCircle, Star, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SwitchRow } from '@/components/ui/switch';
import {
  fieldDraftFrom,
  fieldValuesForApi,
  type FieldDraft,
} from '@/lib/field-input';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { shrinkImage } from '@/lib/shrink-image';
import { Dialog } from '../../../_components/Dialog';
import { Field, FormError } from '../../../_components/fields';
import {
  PricingFields,
  priceForApi,
  pricingError,
  type PricingDraft,
} from '../../../_components/PricingFields';
import { FieldInputs } from './FieldInputs';

/** A photo already saved, or one picked here and not uploaded yet. */
type DraftImage =
  | { key: string; id: string; url: string }
  | { key: string; file: Blob; url: string };

interface Draft extends PricingDraft {
  name: string;
  description: string;
  active: boolean;
  images: DraftImage[];
  attributes: FieldDraft;
}

// The API stores product photos at up to 1600px; a bit more leaves it room.
const PHOTO_MAX_SIDE = 2000;
// Same limit as the API; only reached when the browser can't shrink the file.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const draftFrom = (
  product: ProductDto | null,
  fields: StoreFieldDto[],
): Draft => ({
  name: product?.name ?? '',
  kind: product?.kind ?? 'product',
  priceType: product?.priceType ?? 'fixed',
  priceCents: product?.priceCents ?? 0,
  description: product?.description ?? '',
  active: product?.active ?? true,
  images: (product?.images ?? []).map((image) => ({
    key: image.id,
    id: image.id,
    url: image.url,
  })),
  attributes: fieldDraftFrom(fields, product?.attributes ?? {}),
});

const isSaved = (
  image: DraftImage,
): image is Extract<DraftImage, { id: string }> => 'id' in image;

/**
 * Create or edit a product: photos, name, price, description and visibility. Nothing is
 * sent until "Salvar", which then creates/updates the product and syncs its photos.
 */
export function ProductEditor({
  storeId,
  product: initial,
  maxImages,
  fields,
  onSaved,
  onDeleted,
  onClose,
}: {
  storeId: string;
  /** Null to create a new product. */
  product: ProductDto | null;
  maxImages: number;
  /** The store's custom fields the plan allows. */
  fields: StoreFieldDto[];
  onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onClose: () => void;
}) {
  // Set once the product exists, so a retry after a failed photo upload edits it
  // instead of creating it again.
  const [product, setProduct] = useState(initial);
  const [draft, setDraft] = useState(() => draftFrom(initial, fields));
  const [saved] = useState(() => draftFrom(initial, fields));
  const [errors, setErrors] = useState<{
    name?: string;
    price?: string;
    attribute?: { fieldId: string; message: string };
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const descriptionId = useId();

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // Previews of picked photos are object URLs: free them when the editor closes.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  });
  useEffect(
    () => () => {
      for (const image of draftRef.current.images) {
        if (!isSaved(image)) URL.revokeObjectURL(image.url);
      }
    },
    [],
  );

  function close() {
    if (busy) return;
    if (dirty && !window.confirm('Descartar as alterações deste produto?')) {
      return;
    }
    // A save that failed halfway may still have created the product or some photos.
    if (product !== initial) void onSaved();
    onClose();
  }

  function edit(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setFormError(null);
    // The error of a field goes away as soon as it's edited.
    setErrors((current) => ({
      name: 'name' in changes ? undefined : current.name,
      price:
        'priceCents' in changes || 'priceType' in changes
          ? undefined
          : current.price,
      attribute: 'attributes' in changes ? undefined : current.attribute,
    }));
  }

  async function pickPhotos(files: FileList) {
    const room = maxImages - draft.images.length;
    const picked: DraftImage[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const blob = await shrinkImage(file, PHOTO_MAX_SIDE);
      if (blob.size > MAX_UPLOAD_BYTES) {
        setFormError('Uma das fotos é muito grande. Envie até 10 MB.');
        continue;
      }
      picked.push({
        key: crypto.randomUUID(),
        file: blob,
        url: URL.createObjectURL(blob),
      });
    }
    if (files.length > room) {
      setFormError(`Cada produto pode ter até ${maxImages} fotos.`);
    }
    setDraft((current) => ({
      ...current,
      images: [...current.images, ...picked],
    }));
  }

  function removePhoto(key: string) {
    setDraft((current) => {
      const image = current.images.find((i) => i.key === key);
      if (image && !isSaved(image)) URL.revokeObjectURL(image.url);
      return {
        ...current,
        images: current.images.filter((i) => i.key !== key),
      };
    });
  }

  function makeCover(key: string) {
    setDraft((current) => {
      const image = current.images.find((i) => i.key === key)!;
      return {
        ...current,
        images: [image, ...current.images.filter((i) => i.key !== key)],
      };
    });
  }

  function validate(): boolean {
    const found: typeof errors = {};
    if (draft.name.trim().length < 2) found.name = 'Dê um nome';
    const priceError = pricingError(draft);
    if (priceError) found.price = priceError;
    const attributes = fieldValuesForApi(fields, draft.attributes);
    if ('invalid' in attributes) {
      found.attribute = {
        fieldId: attributes.invalid.id,
        message: 'Digite só números, como 45000 ou 1,5',
      };
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setBusy('save');
    setFormError(null);
    const fail = (error: unknown) =>
      setFormError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));

    try {
      const toApi = (d: Draft) => {
        const attributes = fieldValuesForApi(fields, d.attributes);
        return 'values' in attributes ? attributes.values : {};
      };
      const changes = {
        name: draft.name,
        kind: draft.kind,
        priceType: draft.priceType,
        priceCents: priceForApi(draft),
        description: draft.description,
        active: draft.active,
        attributes: toApi(draft),
      };
      let current = product;
      if (!current) {
        const { data, error } = await productsCreate({
          client: panelApi,
          path: { storeId },
          body: changes,
        });
        if (!data) return fail(error);
        current = data;
        setProduct(data);
      } else if (
        JSON.stringify(changes) !==
        JSON.stringify({
          name: saved.name,
          kind: saved.kind,
          priceType: saved.priceType,
          priceCents: priceForApi(saved),
          description: saved.description,
          active: saved.active,
          attributes: toApi(saved),
        })
      ) {
        const { data, error } = await productsUpdate({
          client: panelApi,
          path: { storeId, productId: current.id },
          body: changes,
        });
        if (!data) return fail(error);
        current = data;
      }
      const path = { storeId, productId: current.id };

      // Photos taken out of the draft.
      const kept = new Set(draft.images.filter(isSaved).map((i) => i.id));
      for (const image of current.images) {
        if (kept.has(image.id)) continue;
        const { data, error } = await productsRemoveImage({
          client: panelApi,
          path: { ...path, imageId: image.id },
        });
        if (!data) return fail(error);
        current = data;
      }

      // New photos, uploaded in the order they appear. Each one becomes a saved photo
      // in the draft right away, so a retry doesn't upload it twice.
      const finalIds: string[] = [];
      for (const image of draft.images) {
        if (isSaved(image)) {
          finalIds.push(image.id);
          continue;
        }
        const before = new Set(current.images.map((i) => i.id));
        const { data, error } = await productsAddImage({
          client: panelApi,
          path,
          body: { file: image.file },
        });
        if (!data) return fail(error);
        current = data;
        const added = data.images.find((i) => !before.has(i.id))!;
        finalIds.push(added.id);
        setDraft((d) => ({
          ...d,
          images: d.images.map((i) =>
            i.key === image.key
              ? { key: image.key, id: added.id, url: image.url }
              : i,
          ),
        }));
      }

      if (current.images.map((i) => i.id).join() !== finalIds.join()) {
        const { data, error } = await productsReorderImages({
          client: panelApi,
          path,
          body: { imageIds: finalIds },
        });
        if (!data) return fail(error);
        current = data;
      }

      setProduct(current);
      await onSaved();
      onClose();
    } catch {
      setFormError('Sem conexão com a internet? Tente de novo.');
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!product) return;
    setBusy('delete');
    try {
      const { error } = await productsRemove({
        client: panelApi,
        path: { storeId, productId: product.id },
      });
      if (error) {
        setFormError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      await onDeleted();
      onClose();
    } catch {
      setFormError('Sem conexão com a internet? Tente de novo.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog
      title={
        initial
          ? initial.kind === 'service'
            ? 'Editar serviço'
            : 'Editar produto'
          : 'Novo item'
      }
      onClose={close}
      footer={
        <>
          {initial &&
            (confirmDelete ? (
              <span className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-sm">
                  {draft.kind === 'service'
                    ? 'Apagar este serviço?'
                    : 'Apagar este produto?'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => setConfirmDelete(false)}
                >
                  Não
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={busy !== null}
                  onClick={() => void remove()}
                >
                  Sim, apagar
                </Button>
              </span>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="mr-auto text-red-600"
                disabled={busy !== null}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> Apagar
              </Button>
            ))}
          {!confirmDelete && (
            <span className="ml-auto flex gap-2">
              <Button variant="ghost" disabled={busy !== null} onClick={close}>
                Cancelar
              </Button>
              <Button
                variant="brand"
                disabled={busy !== null || (Boolean(initial) && !dirty)}
                onClick={() => void save()}
              >
                {busy === 'save' && <LoaderCircle className="animate-spin" />}
                Salvar
              </Button>
            </span>
          )}
        </>
      }
    >
      {busy && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/70 text-sm font-medium backdrop-blur-[2px]">
          <LoaderCircle className="size-7 animate-spin" />
          {busy === 'save' ? 'Salvando…' : 'Apagando…'}
        </div>
      )}
      <div inert={busy !== null} className="flex flex-col gap-5 p-5">
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium">Fotos</span>
            <span className="text-xs text-muted-foreground">
              {draft.images.length} de {maxImages} · a primeira é a capa
            </span>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = event.target.files;
              if (files?.length) void pickPhotos(files);
              event.target.value = '';
            }}
          />
          <ul className="grid grid-cols-3 gap-3">
            {draft.images.map((image, index) => (
              <li
                key={image.key}
                className="group relative aspect-square overflow-hidden rounded-2xl border bg-muted"
              >
                <Image
                  src={image.url}
                  alt={`Foto ${index + 1}`}
                  fill
                  sizes="160px"
                  unoptimized={image.url.startsWith('blob:')}
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 flex h-6 items-center gap-1 rounded-full bg-ink px-2 text-[11px] font-medium text-ink-foreground">
                    <Star className="size-3 fill-current" /> Capa
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(image.key)}
                    aria-label={`Usar a foto ${index + 1} como capa`}
                    title="Usar como capa"
                    className="absolute bottom-1.5 left-1.5 flex size-7 items-center justify-center rounded-full bg-background/90"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(image.key)}
                  aria-label={`Remover a foto ${index + 1}`}
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background/90"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            {draft.images.length < maxImages && (
              <li>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <ImagePlus className="size-6" />
                  Adicionar
                </button>
              </li>
            )}
          </ul>
        </section>

        <Field
          label="Nome"
          value={draft.name}
          error={errors.name}
          maxLength={80}
          autoCapitalize="sentences"
          placeholder={
            draft.kind === 'service'
              ? 'Ex.: Formatação de computador'
              : 'Ex.: Bolo de pote de chocolate'
          }
          onChange={(event) => edit({ name: event.target.value })}
        />

        <PricingFields
          value={draft}
          error={errors.price}
          onChange={(changes) => edit(changes)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor={descriptionId} className="text-sm font-medium">
            Descrição{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            id={descriptionId}
            value={draft.description}
            rows={3}
            maxLength={500}
            placeholder={
              draft.kind === 'service'
                ? 'O que está incluso, quanto tempo leva…'
                : 'Tamanho, sabor, material…'
            }
            onChange={(event) => edit({ description: event.target.value })}
            className="w-full resize-none rounded-2xl border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-foreground/40"
          />
        </div>

        <FieldInputs
          fields={fields}
          value={draft.attributes}
          error={errors.attribute ?? null}
          onChange={(attributes) => edit({ attributes })}
        />

        <SwitchRow
          label="Mostrar na loja"
          description={
            draft.active
              ? 'Clientes veem e podem pedir.'
              : 'Escondido: só você vê aqui no painel.'
          }
          checked={draft.active}
          onChange={(active) => edit({ active })}
        />

        <FormError>{formError}</FormError>
      </div>
    </Dialog>
  );
}
