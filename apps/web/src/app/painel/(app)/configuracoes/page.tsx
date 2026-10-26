'use client';

import { storesUpdate, type StoreDashboardDto } from '@banquinha/api-client';
import { AtSign, LoaderCircle } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { SwitchRow } from '@/components/ui/switch';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import { storeDisplayUrl } from '@/lib/storefront-links';
import { formatWhatsappInput, isCompleteWhatsapp } from '@/lib/whatsapp-input';
import { refreshStorefront } from '../../actions';
import { Field, FormError } from '../../_components/fields';
import { usePanel } from '../_components/panel-context';

interface Draft {
  name: string;
  city: string;
  whatsapp: string;
  instagram: string;
  locationUrl: string;
  serviceArea: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
}

const draftFrom = (store: StoreDashboardDto): Draft => ({
  name: store.name,
  city: store.city ?? '',
  // Stored with the country code (55...); the field shows the national number.
  whatsapp: formatWhatsappInput(store.whatsapp.slice(2)),
  instagram: store.instagram ?? '',
  locationUrl: store.locationUrl ?? '',
  serviceArea: store.serviceArea ?? '',
  pickupEnabled: store.pickupEnabled,
  deliveryEnabled: store.deliveryEnabled,
  onlineEnabled: store.onlineEnabled,
});

/** Store details customers see and how they receive orders. Saved all at once. */
export default function SettingsPage() {
  const { store } = usePanel();
  if (!store) {
    return (
      <LoaderCircle
        className="size-6 animate-spin text-muted-foreground"
        aria-label="Carregando"
      />
    );
  }
  // Remounts with fresh values when another store is picked.
  return <SettingsForm key={store.id} store={store} />;
}

function SettingsForm({ store }: { store: StoreDashboardDto }) {
  const { setStore } = usePanel();
  const [saved, setSaved] = useState(() => draftFrom(store));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>(
    {},
  );
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(changes)) delete next[key as keyof Draft];
      return next;
    });
    setMessage(null);
    setFormError(null);
  }

  function validate(): boolean {
    const found: typeof errors = {};
    if (draft.name.trim().length < 2) found.name = 'Dê um nome à sua loja';
    if (!isCompleteWhatsapp(draft.whatsapp)) {
      found.whatsapp = 'Confira o WhatsApp: use o DDD e o número do celular';
    }
    if (draft.locationUrl.trim() && !/^https?:\/\//i.test(draft.locationUrl)) {
      found.locationUrl = 'Cole o link completo, começando com https://';
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    setMessage(null);
    setFormError(null);
    try {
      const { data, error } = await storesUpdate({
        client: panelApi,
        path: { id: store.id },
        body: draft,
      });
      if (!data) {
        setFormError(apiErrorMessage(error, 'Não deu certo. Tente de novo.'));
        return;
      }
      setStore(data);
      // The API normalizes what was typed (Instagram link → username...).
      const fresh = draftFrom(data);
      setSaved(fresh);
      setDraft(fresh);
      await refreshStorefront(data.handle).catch(() => {});
      setMessage('Salvo! Sua loja já está atualizada.');
    } catch {
      setFormError('Sem conexão com a internet? Tente de novo.');
    } finally {
      setSaving(false);
    }
  }

  const onlyOne =
    Number(draft.pickupEnabled) +
      Number(draft.deliveryEnabled) +
      Number(draft.onlineEnabled) ===
    1;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Configurações
        </h1>
        <p className="mt-1 text-muted-foreground">
          O que aparece na sua loja e como os clientes recebem os pedidos e
          serviços.
        </p>
      </header>

      <div className="relative">
        {saving && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-3xl bg-background/70 text-sm font-medium backdrop-blur-[2px]">
            <LoaderCircle className="size-7 animate-spin" />
            Salvando…
          </div>
        )}
        <div inert={saving} className="flex flex-col gap-6">
          <Section title="Sua loja">
            <Field
              label="Nome da loja"
              value={draft.name}
              error={errors.name}
              maxLength={60}
              onChange={(event) => edit({ name: event.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Endereço da loja</span>
              <p className="flex h-13 items-center rounded-2xl border border-dashed px-4 text-muted-foreground">
                {storeDisplayUrl(store.handle)}
              </p>
              <p className="text-sm text-muted-foreground">
                O endereço não muda, para os links que você já divulgou
                continuarem funcionando.
              </p>
            </div>
          </Section>

          <Section
            title="Contato"
            text="Os botões no topo da sua loja levam para cá."
          >
            <Field
              label="WhatsApp dos pedidos"
              value={draft.whatsapp}
              error={errors.whatsapp}
              hint="Os pedidos chegam neste número."
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(41) 99999-1234"
              onChange={(event) =>
                edit({ whatsapp: formatWhatsappInput(event.target.value) })
              }
            />
            <div className="relative">
              <Field
                label="Instagram"
                value={draft.instagram}
                error={errors.instagram}
                hint="Só o nome de usuário, ou cole o link do perfil."
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="minhaloja"
                className="pl-10"
                onChange={(event) =>
                  edit({
                    instagram: event.target.value.replace(/^@+/, ''),
                  })
                }
              />
              <AtSign className="pointer-events-none absolute top-[2.65rem] left-4 size-4 text-muted-foreground" />
            </div>
            <Field
              label="Link da localização"
              value={draft.locationUrl}
              error={errors.locationUrl}
              hint="No Google Maps: toque no lugar → Compartilhar → Copiar link."
              inputMode="url"
              autoCapitalize="none"
              placeholder="https://maps.app.goo.gl/..."
              onChange={(event) => edit({ locationUrl: event.target.value })}
            />
            <Field
              label="Cidade"
              value={draft.city}
              maxLength={60}
              hint="Aparece no botão de localização."
              placeholder="Ex.: Curitiba"
              onChange={(event) => edit({ city: event.target.value })}
            />
            <Field
              label="Região de atendimento (opcional)"
              value={draft.serviceArea}
              maxLength={120}
              hint="Onde você entrega ou atende. Aparece no topo da loja."
              placeholder="Ex.: Curitiba e região metropolitana"
              onChange={(event) => edit({ serviceArea: event.target.value })}
            />
          </Section>

          <Section
            title="Como os clientes recebem"
            text="A sacola da sua loja só mostra o que estiver ligado."
          >
            <SwitchRow
              label="Retirada ou atendimento no seu endereço"
              description="O cliente busca o pedido com você, ou vem até você para o serviço."
              checked={draft.pickupEnabled}
              disabled={onlyOne && draft.pickupEnabled}
              onChange={(pickupEnabled) => edit({ pickupEnabled })}
            />
            <SwitchRow
              label="Entrega ou atendimento no cliente"
              description="Você leva o pedido ou vai até o cliente; ele informa o endereço na sacola."
              checked={draft.deliveryEnabled}
              disabled={onlyOne && draft.deliveryEnabled}
              onChange={(deliveryEnabled) => edit({ deliveryEnabled })}
            />
            <SwitchRow
              label="Atendimento online"
              description="Para serviços feitos a distância, como aulas e suporte remoto. Só aparece quando a sacola tem apenas serviços."
              checked={draft.onlineEnabled}
              disabled={onlyOne && draft.onlineEnabled}
              onChange={(onlineEnabled) => edit({ onlineEnabled })}
            />
            {onlyOne && (
              <p className="text-sm text-muted-foreground">
                Pelo menos uma forma precisa ficar ligada.
              </p>
            )}
          </Section>

          <FormError>{formError}</FormError>
        </div>
      </div>

      <footer className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur md:mx-0 md:rounded-3xl md:border md:px-5">
        <span
          role="status"
          className="min-w-0 flex-1 text-sm text-muted-foreground"
        >
          {message ??
            (dirty ? 'Você tem alterações que ainda não foram salvas.' : '')}
        </span>
        {dirty && (
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => {
              setDraft(saved);
              setErrors({});
              setFormError(null);
            }}
          >
            Descartar
          </Button>
        )}
        <Button
          variant="brand"
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          {saving && <LoaderCircle className="animate-spin" />}
          Salvar
        </Button>
      </footer>
    </div>
  );
}

function Section({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border bg-surface/60 p-5">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {text && <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>}
      </div>
      {children}
    </section>
  );
}
