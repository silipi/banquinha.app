'use client';

import {
  storeFieldsCreate,
  storeFieldsRemove,
  storeFieldsReorder,
  storeFieldsUpdate,
  type StoreFieldDto,
  type StoreFieldListDto,
} from '@banquinha/api-client';
import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SwitchRow } from '@/components/ui/switch';
import { FIELD_TYPE_LABELS } from '@/lib/field-input';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { Dialog } from '../../../_components/Dialog';
import { Field, FormError } from '../../../_components/fields';

type FieldType = StoreFieldDto['type'];

interface FieldForm {
  label: string;
  type: FieldType;
  unit: string;
  /** One option per line. */
  options: string;
  showOnCard: boolean;
}

const formFrom = (field: StoreFieldDto | null): FieldForm => ({
  label: field?.label ?? '',
  type: field?.type ?? 'text',
  unit: field?.unit ?? '',
  options: field?.options?.join('\n') ?? '',
  showOnCard: field?.showOnCard ?? false,
});

const chip =
  'h-9 rounded-full border bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-muted aria-checked:border-ink aria-checked:bg-ink aria-checked:text-ink-foreground';

/** "Número · km · no card" */
function summary(field: StoreFieldDto): string {
  const parts: string[] = [FIELD_TYPE_LABELS[field.type]];
  if (field.unit) parts.push(field.unit);
  if (field.options) parts.push(field.options.join(', '));
  if (field.showOnCard) parts.push('no card');
  return parts.join(' · ');
}

/**
 * The store's custom fields: create, edit, reorder and delete. Unlike the product
 * editor, each change is saved right away.
 */
export function FieldsDialog({
  storeId,
  list: initial,
  planName,
  onChanged,
  onClose,
}: {
  storeId: string;
  list: StoreFieldListDto;
  planName: string;
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const [list, setList] = useState(initial);
  // null: the list. 'new': creating. Otherwise the field being edited.
  const [editing, setEditing] = useState<StoreFieldDto | 'new' | null>(null);
  const [form, setForm] = useState(() => formFrom(null));
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const optionsId = useId();

  const { fields, maxFields } = list;
  const atLimit = fields.length >= maxFields;

  function close() {
    if (busy) return;
    if (changed) void onChanged();
    onClose();
  }

  function open(field: StoreFieldDto | 'new') {
    setEditing(field);
    setForm(formFrom(field === 'new' ? null : field));
    setError(null);
  }

  /** Runs a call that answers with the new list. */
  async function run(
    call: () => Promise<{ data?: StoreFieldListDto; error?: unknown }>,
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await call();
      if (!data) {
        setError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return false;
      }
      setList(data);
      setChanged(true);
      return true;
    } catch {
      setError('Sem conexão com a internet? Tente de novo.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!form.label.trim()) {
      setError('Dê um nome ao campo');
      return;
    }
    const body = {
      label: form.label,
      unit: form.unit,
      options: form.options.split('\n'),
      showOnCard: form.showOnCard,
    };
    const ok = await run(() =>
      editing === 'new'
        ? storeFieldsCreate({
            client: panelApi,
            path: { storeId },
            body: { ...body, type: form.type },
          })
        : storeFieldsUpdate({
            client: panelApi,
            path: { storeId, fieldId: (editing as StoreFieldDto).id },
            body,
          }),
    );
    if (ok) setEditing(null);
  }

  function move(index: number, by: -1 | 1) {
    const ids = fields.map((f) => f.id);
    [ids[index], ids[index + by]] = [ids[index + by]!, ids[index]!];
    void run(() =>
      storeFieldsReorder({
        client: panelApi,
        path: { storeId },
        body: { fieldIds: ids },
      }),
    );
  }

  async function remove(fieldId: string) {
    if (
      await run(() =>
        storeFieldsRemove({ client: panelApi, path: { storeId, fieldId } }),
      )
    ) {
      setConfirmDelete(null);
    }
  }

  const footer = editing ? (
    <span className="ml-auto flex gap-2">
      <Button variant="ghost" disabled={busy} onClick={() => setEditing(null)}>
        Voltar
      </Button>
      <Button variant="brand" disabled={busy} onClick={() => void save()}>
        {busy && <LoaderCircle className="animate-spin" />}
        Salvar campo
      </Button>
    </span>
  ) : (
    <Button className="ml-auto" disabled={busy} onClick={close}>
      Pronto
    </Button>
  );

  return (
    <Dialog
      title={
        editing === 'new'
          ? 'Novo campo'
          : editing
            ? 'Editar campo'
            : 'Campos dos itens'
      }
      onClose={close}
      footer={footer}
    >
      {editing ? (
        <div inert={busy} className="flex flex-col gap-5 p-5">
          <Field
            label="Nome do campo"
            value={form.label}
            maxLength={30}
            autoCapitalize="sentences"
            placeholder="Ex.: Ano, Km, Tecido, Quartos"
            onChange={(event) =>
              setForm({ ...form, label: event.target.value })
            }
          />

          {editing === 'new' ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Tipo</span>
              <div
                role="radiogroup"
                aria-label="Tipo"
                className="flex flex-wrap gap-2"
              >
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={form.type === type}
                    onClick={() => setForm({ ...form, type })}
                    className={chip}
                  >
                    {FIELD_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                O tipo não muda depois de criado.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tipo: {FIELD_TYPE_LABELS[form.type]}
            </p>
          )}

          {form.type === 'number' && (
            <Field
              label="Unidade (opcional)"
              value={form.unit}
              maxLength={10}
              placeholder="Ex.: km, m², kg"
              onChange={(event) =>
                setForm({ ...form, unit: event.target.value })
              }
            />
          )}

          {form.type === 'choice' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={optionsId} className="text-sm font-medium">
                Opções, uma por linha
              </label>
              <textarea
                id={optionsId}
                value={form.options}
                rows={4}
                placeholder={'Manual\nAutomático'}
                onChange={(event) =>
                  setForm({ ...form, options: event.target.value })
                }
                className="w-full resize-none rounded-2xl border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:border-foreground/40"
              />
            </div>
          )}

          <SwitchRow
            label="Mostrar no card da loja"
            description="Aparece embaixo do nome na lista de itens. Até 2 campos aparecem no card."
            checked={form.showOnCard}
            onChange={(showOnCard) => setForm({ ...form, showOnCard })}
          />

          <FormError>{error}</FormError>
        </div>
      ) : (
        <div inert={busy} className="flex flex-col gap-4 p-5">
          <p className="text-sm text-muted-foreground">
            Informações que você preenche em cada item, como Ano e Km de um
            carro ou Tecido de uma roupa. Elas aparecem na página do item na
            loja.
          </p>

          {fields.length > 0 && (
            <ul className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <li
                  key={field.id}
                  className="flex items-center gap-1 rounded-2xl border bg-surface py-2 pr-2 pl-4"
                >
                  {confirmDelete === field.id ? (
                    <span className="flex flex-1 flex-wrap items-center gap-2 py-1">
                      <span className="text-sm">
                        Apagar “{field.label}” e o valor dele em todos os itens?
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Não
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => void remove(field.id)}
                      >
                        Sim, apagar
                      </Button>
                    </span>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {field.label}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {field.hidden
                            ? `Oculto: passa do limite do plano ${planName}`
                            : summary(field)}
                        </span>
                      </span>
                      <IconButton
                        label={`Subir ${field.label}`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp />
                      </IconButton>
                      <IconButton
                        label={`Descer ${field.label}`}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown />
                      </IconButton>
                      <IconButton
                        label={`Editar ${field.label}`}
                        onClick={() => open(field)}
                      >
                        <Pencil />
                      </IconButton>
                      <IconButton
                        label={`Apagar ${field.label}`}
                        onClick={() => setConfirmDelete(field.id)}
                      >
                        <Trash2 />
                      </IconButton>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {fields.length} de {maxFields} campos no plano {planName}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={atLimit}
              onClick={() => open('new')}
            >
              <Plus /> Novo campo
            </Button>
          </div>

          <FormError>{error}</FormError>
        </div>
      )}
    </Dialog>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
