"use server";
import { getProductsByIds } from "@/lib/browse";

/** المفضّلة محفوظة على الجهاز — الخادم يعيد تفاصيلها فقط */
export async function loadFavorites(ids: number[]) {
  const clean = ids.filter((n) => Number.isInteger(n)).slice(0, 60);
  return getProductsByIds(clean);
}
