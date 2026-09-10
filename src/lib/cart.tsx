"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export type CartItem = {
  productId: number; slug: string; name: string; price: number; unit: string | null;
  image: string | null; storeId: number; storeName: string; storeSlug: string; qty: number;
  /** الخيار المختار (مقاس/لون/عيار) — المنتج بلا خيارات قيمته null */
  variantId?: number | null; variantName?: string | null;
};

/** المفتاح منتج + خيار: نفس الفستان بمقاسين سطران مستقلان في السلة */
export const keyOf = (i: { productId: number; variantId?: number | null }) =>
  `${i.productId}:${i.variantId ?? 0}`;

export type StoreGroup = {
  storeId: number; storeName: string; storeSlug: string; items: CartItem[]; subtotal: number;
};

type Ctx = {
  items: CartItem[]; count: number; total: number; ready: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  removeMany: (productIds: number[]) => void;
  clear: () => void;
  byStore: () => StoreGroup[];
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
      const k = keyOf(item);
      const i = cur.findIndex((x) => keyOf(x) === k);
      if (i === -1) return [...cur, { ...item, qty }];
      const next = [...cur];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      return next;
    });
  }, []);

  const setQty: Ctx["setQty"] = useCallback((key, qty) => {
    setItems((cur) =>
      qty <= 0 ? cur.filter((x) => keyOf(x) !== key)
               : cur.map((x) => (keyOf(x) === key ? { ...x, qty } : x))
    );
  }, []);

  const remove: Ctx["remove"] = useCallback(
    (key) => setItems((cur) => cur.filter((x) => keyOf(x) !== key)), []);

  /** يُستعمل حين يخبرنا الخادم أن منتجات لم تعد متاحة */
  const removeMany: Ctx["removeMany"] = useCallback(
    (ids) => setItems((cur) => cur.filter((x) => !ids.includes(x.productId))), []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(() => {
    const count = items.reduce((n, x) => n + x.qty, 0);
    const total = items.reduce((n, x) => n + x.qty * x.price, 0);
    return {
      items, count, total, ready, add, setQty, remove, removeMany, clear,
      byStore: () => {
        const map = new Map<number, StoreGroup>();
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
  }, [items, ready, add, setQty, remove, removeMany, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart خارج CartProvider");
  return ctx;
}
