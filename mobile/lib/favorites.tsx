import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CatalogProduct } from "./types";

type FavoritesValue = {
  items: CatalogProduct[];
  count: number;
  hydrated: boolean;
  isFavorite: (id: string) => boolean;
  toggle: (product: CatalogProduct) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "pathway_mobile_favorites";

const FavoritesContext = createContext<FavoritesValue>({
  items: [],
  count: 0,
  hydrated: false,
  isFavorite: () => false,
  toggle: () => {},
  remove: () => {},
  clear: () => {},
});

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed)) setItems(parsed as CatalogProduct[]);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const toggle = useCallback((product: CatalogProduct) => {
    setItems((prev) =>
      prev.some((entry) => entry.id === product.id)
        ? prev.filter((entry) => entry.id !== product.id)
        : [product, ...prev],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<FavoritesValue>(
    () => ({
      items,
      count: items.length,
      hydrated,
      isFavorite: (id) => items.some((entry) => entry.id === id),
      toggle,
      remove,
      clear,
    }),
    [items, hydrated, toggle, remove, clear],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
