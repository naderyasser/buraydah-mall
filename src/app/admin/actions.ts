"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { q, q1 } from "@/db";
import { checkCredentials, setSession, clearSession, isLoggedIn } from "@/lib/auth";

async function guard() {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

export async function login(_prev: unknown, form: FormData) {
  const u = String(form.get("username") ?? "");
  const p = String(form.get("password") ?? "");
  if (!checkCredentials(u, p)) return { ok: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." };
  await setSession();
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export async function saveWing(form: FormData) {
  await guard();
  const id = Number(form.get("id") || 0);
  const name_ar = String(form.get("name_ar") ?? "").trim();
  if (!name_ar) return;
  const slug = String(form.get("slug") ?? "").trim() || slugify(String(form.get("name_en") || name_ar));
  const args = [
    slug, name_ar,
    String(form.get("name_en") ?? "").trim() || null,
    String(form.get("tagline") ?? "").trim() || null,
    Number(form.get("sort_order") || 100),
    form.get("is_active") === "on",
  ];
  if (id) {
    await q(
      `UPDATE wings SET slug=$1, name_ar=$2, name_en=$3, tagline=$4, sort_order=$5, is_active=$6 WHERE id=$7`,
      [...args, id]
    );
  } else {
    await q(
      `INSERT INTO wings (slug, name_ar, name_en, tagline, sort_order, is_active) VALUES ($1,$2,$3,$4,$5,$6)`,
      args
    );
  }
  revalidatePath("/", "layout");
  redirect("/admin/wings");
}

async function saveLogo(file: File | null, slug: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!["png", "jpg", "jpeg", "webp", "svg"].includes(ext)) return null;
  const dir = path.join(process.cwd(), "public", "logos");
  await mkdir(dir, { recursive: true });
  const name = `${slug}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/logos/${name}`;
}

export async function saveStore(form: FormData) {
  await guard();
  const id = Number(form.get("id") || 0);
  const name_ar = String(form.get("name_ar") ?? "").trim();
  const dest_value = String(form.get("dest_value") ?? "").trim();
  if (!name_ar || !dest_value) return;

  const slug = String(form.get("slug") ?? "").trim() || slugify(String(form.get("name_en") || name_ar));
  const uploaded = await saveLogo(form.get("logo") as File | null, slug);
  const logo_path = uploaded ?? (String(form.get("logo_path") ?? "").trim() || null);

  let hours: unknown = [];
  try { hours = JSON.parse(String(form.get("hours") || "[]")); } catch { hours = []; }

  const tags = String(form.get("tags") ?? "")
    .split(/[,،]/).map((t) => t.trim()).filter(Boolean);

  const vals = [
    slug,
    Number(form.get("wing_id")),
    name_ar,
    String(form.get("name_en") ?? "").trim() || null,
    logo_path,
    String(form.get("summary_ar") ?? "").trim() || null,
    String(form.get("dest_type") ?? "whatsapp"),
    dest_value,
    String(form.get("whatsapp_text") ?? "").trim() || null,
    String(form.get("address_line") ?? "").trim() || null,
    String(form.get("district") ?? "").trim() || null,
    String(form.get("city") ?? "بريدة").trim(),
    String(form.get("map_url") ?? "").trim() || null,
    String(form.get("phone") ?? "").trim() || null,
    JSON.stringify(hours),
    tags,
    String(form.get("tier") ?? "free"),
    Number(form.get("sort_order") || 100),
    form.get("is_active") === "on",
  ];

  if (id) {
    await q(
      `UPDATE stores SET slug=$1, wing_id=$2, name_ar=$3, name_en=$4, logo_path=$5, summary_ar=$6,
        dest_type=$7, dest_value=$8, whatsapp_text=$9, address_line=$10, district=$11, city=$12,
        map_url=$13, phone=$14, hours=$15::jsonb, tags=$16, tier=$17, sort_order=$18, is_active=$19,
        data_updated_at = now()
       WHERE id=$20`,
      [...vals, id]
    );
  } else {
    await q(
      `INSERT INTO stores (slug, wing_id, name_ar, name_en, logo_path, summary_ar, dest_type, dest_value,
        whatsapp_text, address_line, district, city, map_url, phone, hours, tags, tier, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18,$19)`,
      vals
    );
  }
  revalidatePath("/", "layout");
  redirect("/admin/stores");
}

export async function toggleStore(form: FormData) {
  await guard();
  const id = Number(form.get("id"));
  await q(`UPDATE stores SET is_active = NOT is_active WHERE id = $1`, [id]);
  revalidatePath("/", "layout");
}

export async function setRequestStatus(form: FormData) {
  await guard();
  await q(`UPDATE join_requests SET status=$1 WHERE id=$2`, [
    String(form.get("status")), Number(form.get("id")),
  ]);
  revalidatePath("/admin/requests");
}

export async function setReportStatus(form: FormData) {
  await guard();
  await q(`UPDATE error_reports SET status=$1 WHERE id=$2`, [
    String(form.get("status")), Number(form.get("id")),
  ]);
  revalidatePath("/admin/requests");
}

export async function touchStoreData(form: FormData) {
  await guard();
  const id = Number(form.get("id"));
  const store = await q1<{ slug: string }>(`SELECT slug FROM stores WHERE id=$1`, [id]);
  await q(`UPDATE stores SET data_updated_at = now() WHERE id=$1`, [id]);
  if (store) revalidatePath(`/store/${store.slug}`);
}

/* ── المنتجات ── */
export async function saveProduct(form: FormData) {
  await guard();
  const id = Number(form.get("id") || 0);
  const name_ar = String(form.get("name_ar") ?? "").trim();
  const store_id = Number(form.get("store_id"));
  const price = Number(form.get("price"));
  if (!name_ar || !store_id || !isFinite(price)) return;

  const slug = String(form.get("slug") ?? "").trim() || `p-${store_id}-${Date.now().toString(36)}`;
  const file = form.get("image") as File | null;
  let image_path = String(form.get("image_path") ?? "").trim() || null;
  if (file && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
      const dir = path.join(process.cwd(), "public", "products");
      await mkdir(dir, { recursive: true });
      const nm = `${slug}-${Date.now()}.${ext}`;
      await writeFile(path.join(dir, nm), Buffer.from(await file.arrayBuffer()));
      image_path = `/products/${nm}`;
    }
  }

  const tags = String(form.get("tags") ?? "").split(/[,،]/).map((t) => t.trim()).filter(Boolean);
  const vals = [
    slug, store_id, name_ar,
    String(form.get("description_ar") ?? "").trim() || null,
    price,
    form.get("compare_price") ? Number(form.get("compare_price")) : null,
    image_path,
    String(form.get("unit") ?? "").trim() || null,
    tags,
    form.get("in_stock") === "on",
    Number(form.get("sort_order") || 100),
    form.get("is_active") === "on",
  ];

  if (id) {
    await q(
      `UPDATE products SET slug=$1, store_id=$2, name_ar=$3, description_ar=$4, price=$5,
        compare_price=$6, image_path=$7, unit=$8, tags=$9, in_stock=$10, sort_order=$11, is_active=$12
       WHERE id=$13`, [...vals, id]
    );
  } else {
    await q(
      `INSERT INTO products (slug, store_id, name_ar, description_ar, price, compare_price,
        image_path, unit, tags, in_stock, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, vals
    );
  }
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function toggleProduct(form: FormData) {
  await guard();
  await q(`UPDATE products SET is_active = NOT is_active WHERE id = $1`, [Number(form.get("id"))]);
  revalidatePath("/", "layout");
}

/* ── الطلبات ── */

/**
 * حالة الطلب محصّلة حالات المحلات لا العكس: كل محل يؤكّد نصيبه وحده،
 * والطلب لا يصير «مؤكَّداً» إلا إذا أكّد كل من بقي فيه.
 */
async function syncOrderStatus(orderId: number) {
  await q(
    `UPDATE orders o SET status = d.status FROM (
       SELECT CASE
         WHEN count(*) FILTER (WHERE status <> 'cancelled') = 0            THEN 'cancelled'
         WHEN count(*) FILTER (WHERE status = 'new') > 0                   THEN 'new'
         WHEN count(*) FILTER (WHERE status <> 'cancelled'
                                 AND status <> 'done') = 0                 THEN 'done'
         ELSE 'confirmed'
       END AS status
       FROM order_items WHERE order_id = $1
     ) d WHERE o.id = $1`,
    [orderId]
  );
}

/** تغيير حالة نصيب محل واحد من الطلب */
export async function setOrderItemStatus(form: FormData) {
  await guard();
  const orderId = Number(form.get("order_id"));
  const storeId = Number(form.get("store_id"));
  const status = String(form.get("status"));
  if (!orderId || !storeId) return;
  await q(`UPDATE order_items SET status = $1 WHERE order_id = $2 AND store_id = $3`, [
    status, orderId, storeId,
  ]);
  await syncOrderStatus(orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/** تغيير حالة الطلب كله — إجراء صريح يشمل كل المحلات */
export async function setOrderStatus(form: FormData) {
  await guard();
  const id = Number(form.get("id"));
  const status = String(form.get("status"));
  await q(`UPDATE orders SET status = $1 WHERE id = $2`, [status, id]);
  await q(`UPDATE order_items SET status = $1 WHERE order_id = $2`, [status, id]);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
