import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSettings, type StoreSettings } from "@/lib/settings.functions";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingThreshold: number;
  flatShipping: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "pathway-cart";
const CartContext = createContext<CartContextValue | null>(null);

const FALLBACK_THRESHOLD = 300;
const FALLBACK_FLAT = 19;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    getSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const freeShippingThreshold = settings
    ? settings.freeShippingThresholdCents / 100
    : FALLBACK_THRESHOLD;
  const flatShipping = settings ? settings.flatShippingCents / 100 : FALLBACK_FLAT;

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : flatShipping;
    return {
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      freeShippingThreshold,
      flatShipping,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found) {
            return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p));
          }
          return [...prev, { ...item, qty }];
        }),
      setQty: (id, qty) =>
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p))),
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      clear: () => setItems([]),
    };
  }, [items, freeShippingThreshold, flatShipping]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
