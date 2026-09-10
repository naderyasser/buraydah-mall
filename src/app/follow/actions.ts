"use server";
import { q } from "@/db";

/**
 * متابعة محل أو كلمة بحث: تحوّل زائراً عابراً إلى قائمة تُبلَّغ عند الجديد.
 * بلا حساب — الجوال وحده، كما يتعامل السوق المحلي.
 */
export async function followStore(_prev: unknown, form: FormData) {
  const store_id = Number(form.get("store_id"));
  const phone = String(form.get("phone") ?? "").trim();
  if (!store_id) return { ok: false, message: "محل غير معروف." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  await q(
    `INSERT INTO follows (phone, store_id) VALUES ($1,$2)
     ON CONFLICT (phone, store_id) WHERE store_id IS NOT NULL DO NOTHING`,
    [phone, store_id]
  );
  return { ok: true, message: "تمت المتابعة — نبلّغك عند نزول جديد هذا المحل." };
}

export async function followTerm(_prev: unknown, form: FormData) {
  const term = String(form.get("term") ?? "").trim().slice(0, 80);
  const phone = String(form.get("phone") ?? "").trim();
  if (term.length < 2) return { ok: false, message: "اكتب كلمة البحث." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  await q(
    `INSERT INTO follows (phone, term) VALUES ($1,$2)
     ON CONFLICT (phone, term) WHERE term IS NOT NULL DO NOTHING`,
    [phone, term]
  );
  return { ok: true, message: `سجّلنا تنبيه «${term}» — نبلّغك أول ما ينزل مطابق.` };
}
