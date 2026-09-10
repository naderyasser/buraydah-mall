"use server";
import { revalidatePath } from "next/cache";
import { q } from "@/db";

export async function submitJoinRequest(_prev: unknown, form: FormData) {
  const store_name = String(form.get("store_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  if (store_name.length < 2 || phone.length < 8) {
    return { ok: false, message: "اسم المحل ورقم الجوال مطلوبان." };
  }
  await q(
    `INSERT INTO join_requests (store_name, contact_name, phone, wing_id, note)
     VALUES ($1,$2,$3,$4,$5)`,
    [
      store_name,
      String(form.get("contact_name") ?? "").trim() || null,
      phone,
      form.get("wing_id") ? Number(form.get("wing_id")) : null,
      String(form.get("note") ?? "").trim() || null,
    ]
  );
  return { ok: true, message: "وصلنا طلبك. سنتواصل معك خلال يومي عمل." };
}

export async function submitErrorReport(_prev: unknown, form: FormData) {
  const store_id = Number(form.get("store_id"));
  const note = String(form.get("note") ?? "").trim();
  if (!store_id || note.length < 3) {
    return { ok: false, message: "اكتب وصفاً قصيراً للخطأ." };
  }
  await q(`INSERT INTO error_reports (store_id, field, note) VALUES ($1,$2,$3)`, [
    store_id,
    String(form.get("field") ?? "").trim() || null,
    note,
  ]);
  revalidatePath("/admin");
  return { ok: true, message: "شكراً لك — سنراجع البيانات ونصحّحها." };
}
