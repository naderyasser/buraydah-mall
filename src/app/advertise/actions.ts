"use server";
import { revalidatePath } from "next/cache";
import { q } from "@/db";
import { tooMany, RATE } from "@/lib/ratelimit";

/** طلب حجز مساحة — يصل للإدارة لتتواصل وتفعّل بعد التحويل */
export async function submitAdRequest(_prev: unknown, form: FormData) {
  if (await tooMany("ad-request", RATE.form.limit, RATE.form.windowMs)) return { ok: false, message: RATE.form.msg };
  const brand = String(form.get("brand_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const size = String(form.get("size") ?? "quarter");
  const months = Math.min(12, Math.max(1, Number(form.get("months")) || 1));
  if (brand.length < 2 || !/^0?5\d{8}$/.test(phone.replace(/\s|-/g, ""))) return { ok: false, message: "اسم الماركة ورقم جوال سعودي مطلوبان." };
  if (!["full", "half", "quarter", "small"].includes(size)) return { ok: false, message: "اختر مساحة." };
  await q(
    `INSERT INTO ad_requests (brand_name, contact_name, phone, website, size, months, wing_slug, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [brand, String(form.get("contact_name") ?? "").trim() || null, phone, String(form.get("website") ?? "").trim().slice(0, 200) || null,
     size, months, String(form.get("wing_slug") ?? "").trim() || null, String(form.get("note") ?? "").trim().slice(0, 1000) || null]
  );
  revalidatePath("/admin/ads");
  return { ok: true, message: "وصلنا طلبك — نتواصل معك خلال يوم عمل لتأكيد المساحة وإرسال بيانات التحويل." };
}
