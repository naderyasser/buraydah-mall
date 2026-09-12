"use client";
import { useEffect } from "react";

export const ORDERS_KEY = "mall_orders";

/** يحفظ رمز الطلب على جهاز العميل ليجده في «طلباتي» بلا حساب — كالمفضّلة و«شاهدت مؤخراً» */
export default function RememberOrder({ token, code }: { token: string; code: string }) {
  useEffect(() => {
    try {
      const cur: { token: string; code: string; at: number }[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      const next = [{ token, code, at: Date.now() }, ...cur.filter((o) => o.token !== token)].slice(0, 20);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {}
  }, [token, code]);
  return null;
}
