'use client';

import {
  storesGet,
  type MeDto,
  type StoreDashboardDto,
} from '@banquinha/api-client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { panelApi } from '@/lib/panel';

const SELECTED_STORE_KEY = 'banquinha:store';

interface PanelState {
  me: MeDto;
  /** The store being managed; null while it loads. */
  store: StoreDashboardDto | null;
  selectStore: (id: string) => void;
  setStore: (store: StoreDashboardDto) => void;
}

const PanelContext = createContext<PanelState | null>(null);

/** Signed-in merchant and the store they are managing, shared by the sidebar and pages. */
export function PanelProvider({
  me,
  children,
}: {
  me: MeDto;
  children: ReactNode;
}) {
  const [storeId, setStoreId] = useState(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(SELECTED_STORE_KEY);
    } catch {}
    return me.stores.find((s) => s.id === saved)?.id ?? me.stores[0]!.id;
  });
  const [store, setStore] = useState<StoreDashboardDto | null>(null);

  useEffect(() => {
    storesGet({ client: panelApi, path: { id: storeId } })
      .then(({ data }) => data && setStore(data))
      .catch(() => {});
  }, [storeId]);

  const selectStore = useCallback((id: string) => {
    try {
      localStorage.setItem(SELECTED_STORE_KEY, id);
    } catch {}
    setStore(null);
    setStoreId(id);
  }, []);

  return (
    <PanelContext.Provider value={{ me, store, selectStore, setStore }}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanel(): PanelState {
  const state = useContext(PanelContext);
  if (!state) throw new Error('usePanel must be used inside PanelProvider');
  return state;
}

/** Labels for the optional customizations the API reports in `setup`. */
export const SETUP_LABELS: Record<
  StoreDashboardDto['setup'][number]['id'],
  { title: string; text: string }
> = {
  logo: {
    title: 'Logo',
    text: 'A cara da sua marca no topo da loja.',
  },
  banner: {
    title: 'Banner',
    text: 'Uma imagem larga para dar boas-vindas.',
  },
  description: {
    title: 'Descrição',
    text: 'Conte em uma frase o que você vende.',
  },
};
