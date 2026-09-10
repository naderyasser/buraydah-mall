"use server";
import { q } from "@/db";

/** إعدادات التوصيل لكل محل — السلة تعيش على الجهاز فلا تعرفها */
export async function deliveryInfo(storeIds: number[]) {
  const ids = storeIds.filter((n) => Number.isInteger(n)).slice(0, 30);
  if (!ids.length) return [];
  return q<{ id: number; name_ar: string; delivery_fee: string; free_delivery_over: string | null }>(
    `SELECT id, name_ar, delivery_fee, free_delivery_over FROM stores WHERE id = ANY($1)`,
    [ids]
  );
}
