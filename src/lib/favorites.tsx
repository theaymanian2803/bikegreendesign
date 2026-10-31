import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { CatalogProduct } from "@/lib/catalog";

type FavoritesContextValue = {
  items: CatalogProduct[];
  count: number;
  isFavorite: (id: string) => boolean;
  toggle: (product: CatalogProduct) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "pathway-favorites";
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed as CatalogProduct[]);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      items,
      count: items.length,
      isFavorite: (id) => items.some((item) => item.id === id),
      toggle: (product) =>
        setItems((prev) =>
          prev.some((item) => item.id === product.id)
            ? prev.filter((item) => item.id !== product.id)
            : [product, ...prev],
        ),
      remove: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
