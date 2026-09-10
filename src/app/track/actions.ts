"use server";
import { q, q1 } from "@/db";

/**
 * التتبّع يطلب رقم الطلب **ورقم الجوال** معاً: أحدهما وحده يفتح بيانات
 * غيرك، وهذا بالضبط ما أُغلق في رابط التأكيد.
 */
export async function trackOrder(_prev: unknown, form: FormData) {
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const phone = String(form.get("phone") ?? "").trim().replace(/\s|-/g, "");
  if (!code) return { ok: false as const, message: "اكتب رقم الطلب (مثال: BRD-1003)." };
  if (!/^0?5\d{8}$/.test(phone)) return { ok: false as const, message: "رقم الجوال غير صحيح." };

  const order = await q1<any>(
    `SELECT id, code, token, status, total, discount, delivery_fee, items_count, stores_count,
            fulfilment, pickup_code, created_at
     FROM orders WHERE upper(code) = $1 AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE $2`,
    [code, `%${phone.replace(/^0/, "")}`]
  );
  if (!order) return { ok: false as const, message: "لا يوجد طلب بهذا الرقم مع هذا الجوال." };

  const parts = await q<any>(
    `SELECT s.name_ar AS store, s.slug, s.phone, oi.status,
            sum(oi.qty)::int AS qty, sum(oi.price * oi.qty) AS value,
            string_agg(oi.name_ar || coalesce(' — ' || oi.variant_name, '') || ' ×' || oi.qty, ' · ') AS lines
     FROM order_items oi JOIN stores s ON s.id = oi.store_id
     WHERE oi.order_id = $1
     GROUP BY s.id, s.name_ar, s.slug, s.phone, oi.status ORDER BY s.name_ar`,
    [order.id]
  );

  return { ok: true as const, order, parts, message: "" };
}
