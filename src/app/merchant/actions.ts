"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { q, q1 } from "@/db";
import {
  currentStoreId, setMerchantSession, clearMerchantSession, verifyPassword,
} from "@/lib/merchant-auth";
import { tooMany, RATE } from "@/lib/ratelimit";
import { occasionEnd, OCCASION_TAG } from "@/lib/saudi";
import { importProductsCsv } from "@/lib/import-products";

async function guard(): Promise<number> {
  const id = await currentStoreId();
  if (!id) redirect("/merchant/login");
  return id;
}

export async function merchantLogin(_prev: unknown, form: FormData) {
  if (await tooMany("merchantlogin", RATE.login.limit, RATE.login.windowMs))
    return { ok: false, message: RATE.login.msg };
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

/** عرض المحل على طلب شراء — يصل الزبون بالجوال، والرقم لا يُنشر في الصفحة */
export async function merchantMakeOffer(form: FormData) {
  const storeId = await guard();
  const requestId = Number(form.get("request_id"));
  const priceRaw = String(form.get("price") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  if (!requestId) return;
  const { scrubContact } = await import("@/lib/sanitize");
  await q(
    `INSERT INTO buy_offers (request_id, store_id, price, note) VALUES ($1,$2,$3,$4)
     ON CONFLICT (request_id, store_id)
     DO UPDATE SET price = $3, note = $4, created_at = now()`,
    [requestId, storeId, priceRaw ? Number(priceRaw) : null, note ? scrubContact(note).text : null]
  );
  revalidatePath("/merchant/requests");
  revalidatePath("/requests");
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

/**
 * المشاركة في عروض المناسبة بضغطة (كما تفعل سلة وزد في المواسم): يختار التاجر
 * منتجاته ونسبة الخصم، والمول يحفظ السعر الأصلي في compare_price ويضبط تاريخ
 * الانتهاء ويوسمها؛ وفحص الصحة يعيد السعر تلقائياً بعد النهاية.
 */
export async function merchantJoinOccasion(form: FormData) {
  const storeId = await guard();
  const ids = form.getAll("product_id").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const pct = Number(form.get("pct"));
  const win = occasionEnd();
  if (!win || ids.length === 0 || !(pct >= 5 && pct <= 90)) return;
  await q(
    `UPDATE products
       SET compare_price = coalesce(compare_price, price),
           price = round(coalesce(compare_price, price) * (1 - $3::numeric / 100), 2),
           sale_ends_at = $4,
           tags = CASE WHEN $5 = ANY(tags) THEN tags ELSE array_append(coalesce(tags, '{}'), $5) END
     WHERE store_id = $1 AND id = ANY($2) AND is_active`,
    [storeId, ids, pct, win.ends, OCCASION_TAG]
  );
  revalidatePath("/merchant/occasion");
  revalidatePath("/national-day");
  revalidatePath("/", "layout");
}

/** سحب منتج من عروض المناسبة: يعود سعره كما كان فوراً */
export async function merchantLeaveOccasion(form: FormData) {
  const storeId = await guard();
  await q(
    `UPDATE products SET price = coalesce(compare_price, price), compare_price = NULL, sale_ends_at = NULL,
            tags = array_remove(tags, $3)
     WHERE store_id = $1 AND id = $2 AND $3 = ANY(tags)`,
    [storeId, Number(form.get("id")), OCCASION_TAG]
  );
  revalidatePath("/merchant/occasion");
  revalidatePath("/national-day");
  revalidatePath("/", "layout");
}

/** عدد الطلبات الجديدة لمحل التاجر — تسأله البوابة كل دقيقة */
export async function merchantNewCount(): Promise<number> {
  const storeId = await guard();
  const r = await q1<{ n: number }>(
    `SELECT count(DISTINCT order_id)::int AS n FROM order_items WHERE store_id = $1 AND status = 'new'`, [storeId]);
  return r?.n ?? 0;
}

/** استيراد CSV لمحل التاجر نفسه */
export async function merchantImportCsv(_prev: unknown, form: FormData) {
  const storeId = await guard();
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) return { inserted: 0, skipped: 0, errors: ["اختر الملف."] };
  if (file.size > 2_000_000) return { inserted: 0, skipped: 0, errors: ["الملف أكبر من 2MB."] };
  const res = await importProductsCsv(storeId, await file.text());
  revalidatePath("/merchant/products"); revalidatePath("/", "layout");
  return res;
}
