"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type CartItem = {
  productId: number; slug: string; name: string; price: number; unit: string | null;
  image: string | null; storeId: number; storeName: string; storeSlug: string; qty: number;
};

type Ctx = {
  items: CartItem[]; count: number; total: number; ready: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  byStore: () => { storeId: number; storeName: string; storeSlug: string; items: CartItem[]; subtotal: number }[];
};

const KEY = "mall_cart_v1";
const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* سلة فارغة أفضل من صفحة معطّلة */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* تجاهل */ }
  }, [items, ready]);

  const add: Ctx["add"] = useCallback((item, qty = 1) => {
    setItems((cur) => {
      const i = cur.findIndex((x) => x.productId === item.productId);
      if (i === -1) return [...cur, { ...item, qty }];
      const next = [...cur];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      return next;
    });
  }, []);

  const setQty: Ctx["setQty"] = useCallback((productId, qty) => {
    setItems((cur) =>
      qty <= 0 ? cur.filter((x) => x.productId !== productId)
               : cur.map((x) => (x.productId === productId ? { ...x, qty } : x))
    );
  }, []);

  const remove: Ctx["remove"] = useCallback(
    (productId) => setItems((cur) => cur.filter((x) => x.productId !== productId)), []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => {
    const count = items.reduce((n, x) => n + x.qty, 0);
    const total = items.reduce((n, x) => n + x.qty * x.price, 0);
    return {
      items, count, total, ready, add, setQty, remove, clear,
      byStore: () => {
        const map = new Map<number, { storeId: number; storeName: string; storeSlug: string; items: CartItem[]; subtotal: number }>();
        for (const it of items) {
          const g = map.get(it.storeId) ?? {
            storeId: it.storeId, storeName: it.storeName, storeSlug: it.storeSlug, items: [], subtotal: 0,
          };
          g.items.push(it);
          g.subtotal += it.qty * it.price;
          map.set(it.storeId, g);
        }
        return [...map.values()];
      },
    };
  }, [items, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart خارج CartProvider");
  return ctx;
}
