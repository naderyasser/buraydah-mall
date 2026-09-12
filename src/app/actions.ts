"use server";
import { revalidatePath } from "next/cache";
import { q, q1 } from "@/db";
import { scrubContact } from "@/lib/sanitize";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { tooMany, RATE } from "@/lib/ratelimit";

export async function submitJoinRequest(_prev: unknown, form: FormData) {
  if (await tooMany("join", RATE.form.limit, RATE.form.windowMs))
    return { ok: false, message: RATE.form.msg };
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
  if (await tooMany("report", RATE.form.limit, RATE.form.windowMs))
    return { ok: false, message: RATE.form.msg };
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

/** يُسجّل ما يبحث عنه الناس — ما لا يجده الزائر هو أهم بيانات المول */
export async function logSearch(term: string, results = 0) {
  const t = term.trim().slice(0, 80);
  if (t.length < 2) return;
  try {
    await q(`INSERT INTO searches (term, results) VALUES ($1,$2)`, [t, results]);
  } catch (err) {
    console.error("[search] log failed", err);
  }
}

/** المشاهدات: أساس «الأكثر مشاهدة» ورقم يهمّ التاجر */
export async function bumpViews(productId: number) {
  try {
    await q(`UPDATE products SET views = views + 1 WHERE id = $1`, [productId]);
  } catch { /* عدّاد لا يستحق تعطيل صفحة */ }
}

/**
 * التقييم لا يُنشر قبل المراجعة، ولا يُقبل إلا ممّن طلب فعلاً من المحل:
 * السوق المحلي الصغير لا يحتمل تصفية حسابات بالنجوم.
 */
export async function submitReview(_prev: unknown, form: FormData) {
  if (await tooMany("review", RATE.review.limit, RATE.review.windowMs))
    return { ok: false, message: RATE.review.msg };
  const product_id = Number(form.get("product_id")) || null;
  const store_id = Number(form.get("store_id"));
  const rating = Number(form.get("rating"));
  const author = String(form.get("author_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const body = String(form.get("body") ?? "").trim() || null;

  if (!store_id || !(rating >= 1 && rating <= 5)) return { ok: false, message: "اختر تقييماً من 1 إلى 5." };
  if (author.length < 2) return { ok: false, message: "اكتب اسمك." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  const bought = await q1<{ n: number }>(
    `SELECT count(*)::int AS n FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.store_id = $1 AND o.phone = $2 AND oi.status <> 'cancelled'`,
    [store_id, phone]
  );
  if (!bought?.n) {
    return { ok: false, message: "التقييم لمن طلب من هذا المحل عبر المول. اطلب أولاً ثم قيّم." };
  }

  const dup = await q1<{ id: number }>(
    `SELECT id FROM reviews WHERE store_id = $1 AND phone = $2
       AND coalesce(product_id, 0) = coalesce($3, 0)`,
    [store_id, phone, product_id]
  );
  if (dup) return { ok: false, message: "سبق أن قيّمت هذا المحل — تقييمك محفوظ." };

  // صورة من العميل (نون/أمازون): تُحفظ ولا تُنشر إلا بعد مراجعة الإدارة — وقاعدة «لا صور أشخاص» تُطبَّق هناك
  let image_path: string | null = null;
  const file = form.get("image") as File | null;
  if (file && file.size > 0) {
    if (file.size > 4_000_000) return { ok: false, message: "الصورة أكبر من 4MB." };
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return { ok: false, message: "الصورة يجب أن تكون JPG أو PNG أو WebP." };
    const dir = path.join(process.cwd(), "public", "reviews");
    await mkdir(dir, { recursive: true });
    const nm = `r-${store_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    await writeFile(path.join(dir, nm), Buffer.from(await file.arrayBuffer()));
    image_path = `/reviews/${nm}`;
  }
  // الأرقام والروابط تُحجب: الصفقة التي تخرج من المنصّة لا تُقاس ولا يحميها أحد
  await q(
    `INSERT INTO reviews (store_id, product_id, author_name, phone, rating, body, image_path)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [store_id, product_id, author, phone, rating, body ? scrubContact(body).text : null, image_path]
  );
  revalidatePath("/admin/reviews");
  return { ok: true, message: "وصل تقييمك — يُنشر بعد المراجعة. شكراً لك." };
}

/** «أعلمني عند التوفّر» — قائمة انتظار تكشف الطلب الحقيقي على منتج نفد */
export async function notifyWhenBack(_prev: unknown, form: FormData) {
  if (await tooMany("alert", RATE.form.limit, RATE.form.windowMs))
    return { ok: false, message: RATE.form.msg };
  const product_id = Number(form.get("product_id"));
  const phone = String(form.get("phone") ?? "").trim();
  if (!product_id) return { ok: false, message: "منتج غير معروف." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  await q(
    `INSERT INTO stock_alerts (product_id, phone) VALUES ($1,$2)
     ON CONFLICT (product_id, phone) DO NOTHING`,
    [product_id, phone]
  );
  return { ok: true, message: "سجّلنا رقمك — نبلّغك أول ما يتوفّر." };
}

/** سؤال عام على المنتج يجيب عنه المحل — يصنع محتوى ويكشف البطيء */
export async function askQuestion(_prev: unknown, form: FormData) {
  if (await tooMany("question", RATE.form.limit, RATE.form.windowMs))
    return { ok: false, message: RATE.form.msg };
  const product_id = Number(form.get("product_id"));
  const store_id = Number(form.get("store_id"));
  const body = String(form.get("body") ?? "").trim();
  const author = String(form.get("author_name") ?? "").trim() || "زائر";
  if (!product_id || !store_id) return { ok: false, message: "منتج غير معروف." };
  if (body.length < 5) return { ok: false, message: "اكتب سؤالاً أوضح." };

  await q(
    `INSERT INTO questions (product_id, store_id, author_name, body) VALUES ($1,$2,$3,$4)`,
    [product_id, store_id, scrubContact(author).text, scrubContact(body).text]
  );
  return { ok: true, message: "وصل سؤالك — يظهر مع جواب المحل بعد المراجعة." };
}
