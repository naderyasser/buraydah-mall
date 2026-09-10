"use server";
import { revalidatePath } from "next/cache";
import { q, q1 } from "@/db";
import { scrubContact } from "@/lib/sanitize";

/**
 * طلب شراء معاكس: الزبون ينشر ما يريده والمحلات تعرض عليه.
 * أنسب ما يكون لسوق محلي: يكشف الطلب على بضاعة لا نملكها بعد.
 */
export async function postBuyRequest(_prev: unknown, form: FormData) {
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim() || null;
  const name = String(form.get("customer_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const district = String(form.get("district") ?? "").trim() || null;
  const wing_id = form.get("wing_id") ? Number(form.get("wing_id")) : null;
  const budget = form.get("budget_max") ? Number(form.get("budget_max")) : null;

  if (title.length < 5) return { ok: false as const, message: "اكتب وصفاً أوضح لما تريده." };
  if (name.length < 2) return { ok: false as const, message: "اكتب اسمك." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false as const, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  // الجوال لا يُنشر في نص الطلب: المحل يصله الرقم، والزائر لا يراه
  const safeTitle = scrubContact(title).text;
  const safeBody = body ? scrubContact(body).text : null;

  const row = await q1<{ token: string }>(
    `INSERT INTO buy_requests (token, wing_id, title, body, budget_max, customer_name, phone, district)
     VALUES (replace(gen_random_uuid()::text,'-',''), $1,$2,$3,$4,$5,$6,$7)
     RETURNING token`,
    [wing_id, safeTitle, safeBody, budget, name, phone, district]
  );

  revalidatePath("/requests");
  return { ok: true as const, token: row!.token, message: "نُشر طلبك — ستصلك عروض المحلات على جوالك." };
}

/** عرض المحل على طلب شراء — من بوابة التاجر */
export async function makeOffer(storeId: number, requestId: number, price: number | null, note: string) {
  const safe = scrubContact(note).text;
  await q(
    `INSERT INTO buy_offers (request_id, store_id, price, note) VALUES ($1,$2,$3,$4)
     ON CONFLICT (request_id, store_id) DO UPDATE SET price = $3, note = $4, created_at = now()`,
    [requestId, storeId, price, safe]
  );
  revalidatePath("/merchant/requests");
  revalidatePath("/requests");
}
