"use server";
import { q1 } from "@/db";

export type CouponResult =
  | { ok: true; code: string; kind: "percent" | "amount"; value: number; storeId: number | null; message: string }
  | { ok: false; message: string };

/**
 * الكوبون خصم يلتزم به المحل عند الاستلام لا خصم على بطاقة:
 * لذلك يُتحقّق منه هنا ويُطبع في تأكيد الطلب ليراه التاجر.
 */
export async function checkCoupon(_prev: unknown, form: FormData): Promise<CouponResult> {
  const code = String(form.get("coupon") ?? "").trim().toUpperCase();
  const subtotal = Number(form.get("subtotal") ?? 0);
  if (!code) return { ok: false, message: "اكتب رمز الكوبون." };

  const c = await q1<any>(
    `SELECT * FROM coupons WHERE upper(code) = $1 AND is_active
       AND (expires_on IS NULL OR expires_on >= current_date)
       AND (max_uses IS NULL OR used_count < max_uses)`,
    [code]
  );
  if (!c) return { ok: false, message: "رمز غير صالح أو منتهٍ." };
  if (subtotal < Number(c.min_total)) {
    return { ok: false, message: `الكوبون يبدأ من ${Number(c.min_total)} ر.س.` };
  }

  return {
    ok: true,
    code: c.code,
    kind: c.kind,
    value: Number(c.value),
    storeId: c.store_id,
    message: c.kind === "percent" ? `خصم ${Number(c.value)}%` : `خصم ${Number(c.value)} ر.س`,
  };
}
