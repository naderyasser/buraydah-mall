"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { q, q1 } from "@/db";
import {
  currentStoreId, setMerchantSession, clearMerchantSession, verifyPassword,
} from "@/lib/merchant-auth";

async function guard(): Promise<number> {
  const id = await currentStoreId();
  if (!id) redirect("/merchant/login");
  return id;
}

export async function merchantLogin(_prev: unknown, form: FormData) {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const m = await q1<any>(
    `SELECT m.*, s.is_active AS store_active FROM merchants m
     JOIN stores s ON s.id = m.store_id WHERE m.username = $1 AND m.is_active`,
    [username]
  );
  if (!m || !verifyPassword(password, m.password_hash)) {
    return { ok: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." };
  }
  await q(`UPDATE merchants SET last_login_at = now() WHERE id = $1`, [m.id]);
  await setMerchantSession(m.store_id);
  redirect("/merchant");
}

export async function merchantLogout() {
  await clearMerchantSession();
  redirect("/merchant/login");
}

/** التاجر يغيّر حالة نصيبه من الطلب فقط — لا يرى طلبات غيره ولا يغيّرها */
export async function merchantSetItemStatus(form: FormData) {
  const storeId = await guard();
  const orderId = Number(form.get("order_id"));
  const status = String(form.get("status"));
  if (!orderId || !["new", "confirmed", "done", "cancelled"].includes(status)) return;

  await q(`UPDATE order_items SET status = $1 WHERE order_id = $2 AND store_id = $3`,
    [status, orderId, storeId]);
  await q(
    `UPDATE orders o SET status = d.status FROM (
       SELECT CASE
         WHEN count(*) FILTER (WHERE status <> 'cancelled') = 0 THEN 'cancelled'
         WHEN count(*) FILTER (WHERE status = 'new') > 0        THEN 'new'
         WHEN count(*) FILTER (WHERE status <> 'cancelled' AND status <> 'done') = 0 THEN 'done'
         ELSE 'confirmed' END AS status
       FROM order_items WHERE order_id = $1
     ) d WHERE o.id = $1`,
    [orderId]
  );
  revalidatePath("/merchant/orders");
  revalidatePath("/merchant");
}

export async function merchantToggleProduct(form: FormData) {
  const storeId = await guard();
  await q(`UPDATE products SET is_active = NOT is_active WHERE id = $1 AND store_id = $2`,
    [Number(form.get("id")), storeId]);
  revalidatePath("/merchant/products");
  revalidatePath("/", "layout");
}

export async function merchantSetStock(form: FormData) {
  const storeId = await guard();
  await q(`UPDATE products SET in_stock = NOT in_stock WHERE id = $1 AND store_id = $2`,
    [Number(form.get("id")), storeId]);
  revalidatePath("/merchant/products");
  revalidatePath("/", "layout");
}

/** الردّ على التقييم — ولا حذف: التقييم السلبي يُردّ عليه ولا يُمحى */
export async function merchantReplyReview(form: FormData) {
  const storeId = await guard();
  const id = Number(form.get("id"));
  const reply = String(form.get("reply") ?? "").trim();
  if (!id || reply.length < 2) return;
  await q(
    `UPDATE reviews SET reply = $1, replied_at = now() WHERE id = $2 AND store_id = $3`,
    [reply, id, storeId]
  );
  revalidatePath("/merchant/reviews");
}

export async function merchantAnswerQuestion(form: FormData) {
  const storeId = await guard();
  const id = Number(form.get("id"));
  const answer = String(form.get("answer") ?? "").trim();
  if (!id || answer.length < 2) return;
  await q(
    `UPDATE questions SET answer = $1, answered_at = now(), status = 'published'
     WHERE id = $2 AND store_id = $3`,
    [answer, id, storeId]
  );
  revalidatePath("/merchant/questions");
}

/** التاجر يحرّر بيانات التواصل والدوام والتوصيل — لا الفئة ولا العمولة */
export async function merchantSaveSettings(form: FormData) {
  const storeId = await guard();
  let hours: unknown = [];
  try { hours = JSON.parse(String(form.get("hours") || "[]")); } catch { hours = []; }

  await q(
    `UPDATE stores SET summary_ar = $1, phone = $2, address_line = $3, district = $4,
       map_url = $5, hours = $6::jsonb, delivery_fee = $7, free_delivery_over = $8,
       returns_policy = $9, cr_number = $10, vat_number = $11, maroof_number = $12,
       data_updated_at = now()
     WHERE id = $13`,
    [
      String(form.get("summary_ar") ?? "").trim() || null,
      String(form.get("phone") ?? "").trim() || null,
      String(form.get("address_line") ?? "").trim() || null,
      String(form.get("district") ?? "").trim() || null,
      String(form.get("map_url") ?? "").trim() || null,
      JSON.stringify(hours),
      Number(form.get("delivery_fee") || 0),
      form.get("free_delivery_over") ? Number(form.get("free_delivery_over")) : null,
      String(form.get("returns_policy") ?? "").trim() || null,
      String(form.get("cr_number") ?? "").trim() || null,
      String(form.get("vat_number") ?? "").trim() || null,
      String(form.get("maroof_number") ?? "").trim() || null,
      storeId,
    ]
  );
  revalidatePath("/merchant/settings");
  revalidatePath("/", "layout");
}
