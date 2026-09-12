"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { q, q1 } from "@/db";
import { tooMany, RATE } from "@/lib/ratelimit";
import { pushToStore } from "@/lib/push";
import { waNumber } from "@/lib/settings";
import { buildDestUrl } from "@/lib/destinations";

export type LeadResult =
  | { ok: true; token: string; message: string; wa: string | null; site: string | null; storeName: string }
  | { ok: false; message: string };

/**
 * طلب من ماركة داخل المول: يُحفظ ويُنبَّه المعلن (Web Push) ويُعطى الزائر رابط واتساب
 * برسالة جاهزة — الطلب يُقاس هنا أولاً ثم يكمل حيث تريد الماركة.
 */
export async function submitLead(_prev: unknown, form: FormData): Promise<LeadResult> {
  if (await tooMany("lead", RATE.order.limit, RATE.order.windowMs)) return { ok: false, message: RATE.order.msg };
  const store_id = Number(form.get("store_id"));
  const product_id = Number(form.get("product_id")) || null;
  const placement_id = Number(form.get("placement_id")) || null;
  const name = String(form.get("customer_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim().replace(/\s|-/g, "");
  const district = String(form.get("district") ?? "").trim() || null;
  const message = String(form.get("message") ?? "").trim().slice(0, 1000) || null;
  const source = String(form.get("source") ?? "").trim().slice(0, 200) || null;
  if (!store_id) return { ok: false, message: "الماركة غير محدّدة." };
  if (name.length < 2) return { ok: false, message: "اكتب اسمك." };
  if (!/^0?5\d{8}$/.test(phone)) return { ok: false, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  const store = await q1<any>(`SELECT id, name_ar, phone, dest_type, dest_value, whatsapp_text FROM stores WHERE id = $1 AND is_active`, [store_id]);
  if (!store) return { ok: false, message: "الماركة غير موجودة." };
  const product = product_id ? await q1<{ name_ar: string }>(`SELECT name_ar FROM products WHERE id = $1`, [product_id]) : null;

  // الرقم يُحفظ بصيغة واحدة كي يُربط الزائر بطلباته لاحقاً
  const normPhone = phone.replace(/^0/, "");
  const token = randomBytes(12).toString("hex");
  await q(
    `INSERT INTO leads (token, store_id, product_id, placement_id, customer_name, phone, district, message, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [token, store_id, product_id, placement_id, name, normPhone, district, message, source]
  );
  revalidatePath("/merchant"); revalidatePath("/admin/leads");

  const what = product ? `«${product.name_ar}»` : "منتجاتكم";
  void pushToStore(store_id, { title: `طلب جديد من ${name}`, body: `${what}${message ? " — " + message.slice(0, 60) : ""} · افتح بوابتك للردّ`, url: "/merchant/leads", tag: "lead-" + token }).catch(() => {});

  const waText = `السلام عليكم ${store.name_ar}، أرسلت طلباً عبر مول بريدة:\n${what}${message ? "\n" + message : ""}\nالاسم: ${name}${district ? "\nالحي: " + district : ""}`;
  const wa = store.phone ? `https://wa.me/${waNumber(store.phone)}?text=${encodeURIComponent(waText)}` : null;
  const site = store.dest_type && store.dest_value ? buildDestUrl(store) : null;
  return { ok: true, token, message: "وصل طلبك للماركة — تتواصل معك على جوالك. تقدر تكمّل على واتساب الآن:", wa, site, storeName: store.name_ar };
}

/** طلبات هذا الجهاز (بالرموز المحفوظة) — «طلباتي» بلا حساب */
export async function leadsByTokens(tokens: string[]) {
  const clean = [...new Set(tokens.filter((t) => typeof t === "string" && t.length >= 16))].slice(0, 30);
  if (clean.length === 0) return [];
  return q<{ token: string; status: string; created_at: string; store: string; store_slug: string; product: string | null; message: string | null }>(
    `SELECT l.token, l.status, l.created_at::text AS created_at, s.name_ar AS store, s.slug AS store_slug, p.name_ar AS product, l.message
     FROM leads l JOIN stores s ON s.id = l.store_id LEFT JOIN products p ON p.id = l.product_id
     WHERE l.token = ANY($1) ORDER BY l.created_at DESC`, [clean]);
}
