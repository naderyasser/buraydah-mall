"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { q, q1 } from "@/db";
import { checkCredentials, setSession, clearSession, isLoggedIn } from "@/lib/auth";
import { hashPassword } from "@/lib/merchant-auth";

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
  // المواصفات تُكتب سطراً لكل واحدة «الاسم: القيمة» — أسهل ما يُملأ يدوياً
  const specs = String(form.get("specs") ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const i = line.indexOf(":");
      if (i < 1) return null;
      return { k: line.slice(0, i).trim(), v: line.slice(i + 1).trim() };
    })
    .filter((x): x is { k: string; v: string } => !!x && !!x.k && !!x.v);

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
    form.get("category_id") ? Number(form.get("category_id")) : null,
    String(form.get("variant_label") ?? "").trim() || null,
    JSON.stringify(specs),
  ];

  if (id) {
    await q(
      `UPDATE products SET slug=$1, store_id=$2, name_ar=$3, description_ar=$4, price=$5,
        compare_price=$6, image_path=$7, unit=$8, tags=$9, in_stock=$10, sort_order=$11, is_active=$12,
        category_id=$13, variant_label=$14, specs=$15::jsonb
       WHERE id=$16`, [...vals, id]
    );
  } else {
    await q(
      `INSERT INTO products (slug, store_id, name_ar, description_ar, price, compare_price,
        image_path, unit, tags, in_stock, sort_order, is_active, category_id, variant_label, specs)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)`, vals
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


/* ── التصنيفات الفرعية ── */
export async function saveCategory(form: FormData) {
  await guard();
  const id = Number(form.get("id") || 0);
  const name_ar = String(form.get("name_ar") ?? "").trim();
  const wing_id = Number(form.get("wing_id"));
  if (!name_ar || !wing_id) return;
  const slug = String(form.get("slug") ?? "").trim() || slugify(name_ar);
  const args = [slug, wing_id, name_ar, Number(form.get("sort_order") || 100), form.get("is_active") !== null];
  if (id) {
    await q(`UPDATE categories SET slug=$1, wing_id=$2, name_ar=$3, sort_order=$4, is_active=$5 WHERE id=$6`,
      [...args, id]);
  } else {
    await q(`INSERT INTO categories (slug, wing_id, name_ar, sort_order, is_active) VALUES ($1,$2,$3,$4,$5)`, args);
  }
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(form: FormData) {
  await guard();
  await q(`DELETE FROM categories WHERE id = $1`, [Number(form.get("id"))]);
  revalidatePath("/", "layout");
}

/* ── مراجعة التقييمات: تُنشر أو تُرفض، ولا تُحذف بعد النشر ── */
export async function setReviewStatus(form: FormData) {
  await guard();
  await q(`UPDATE reviews SET status = $1 WHERE id = $2`,
    [String(form.get("status")), Number(form.get("id"))]);
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}

export async function setQuestionStatus(form: FormData) {
  await guard();
  await q(`UPDATE questions SET status = $1 WHERE id = $2`,
    [String(form.get("status")), Number(form.get("id"))]);
  revalidatePath("/admin/reviews");
}

/* ── الكوبونات ── */
export async function saveCoupon(form: FormData) {
  await guard();
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const value = Number(form.get("value"));
  if (!code || !(value > 0)) return;
  await q(
    `INSERT INTO coupons (code, store_id, kind, value, min_total, max_uses, expires_on, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true)
     ON CONFLICT (code) DO UPDATE SET store_id=$2, kind=$3, value=$4, min_total=$5,
       max_uses=$6, expires_on=$7`,
    [
      code,
      form.get("store_id") ? Number(form.get("store_id")) : null,
      String(form.get("kind") ?? "percent"),
      value,
      Number(form.get("min_total") || 0),
      form.get("max_uses") ? Number(form.get("max_uses")) : null,
      String(form.get("expires_on") ?? "").trim() || null,
    ]
  );
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function toggleCoupon(form: FormData) {
  await guard();
  await q(`UPDATE coupons SET is_active = NOT is_active WHERE id = $1`, [Number(form.get("id"))]);
  revalidatePath("/admin/coupons");
}

/* ── حسابات التجار: الإدارة تُنشئها، فبوابة التاجر ليست تسجيلاً حراً ── */
export async function saveMerchant(form: FormData) {
  await guard();
  const store_id = Number(form.get("store_id"));
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!store_id || username.length < 3) return;

  if (password.length >= 6) {
    await q(
      `INSERT INTO merchants (store_id, username, password_hash) VALUES ($1,$2,$3)
       ON CONFLICT (store_id) DO UPDATE SET username = $2, password_hash = $3, is_active = true`,
      [store_id, username, hashPassword(password)]
    );
  } else {
    await q(`UPDATE merchants SET username = $1 WHERE store_id = $2`, [username, store_id]);
  }
  revalidatePath("/admin/merchants");
  redirect("/admin/merchants");
}

export async function toggleMerchant(form: FormData) {
  await guard();
  await q(`UPDATE merchants SET is_active = NOT is_active WHERE id = $1`, [Number(form.get("id"))]);
  revalidatePath("/admin/merchants");
}

export async function toggleVerified(form: FormData) {
  await guard();
  await q(`UPDATE stores SET is_verified = NOT is_verified WHERE id = $1`, [Number(form.get("id"))]);
  revalidatePath("/admin/stores");
  revalidatePath("/", "layout");
}

/* ── خيارات المنتج وصوره ── */
export async function saveVariant(form: FormData) {
  await guard();
  const product_id = Number(form.get("product_id"));
  const name_ar = String(form.get("name_ar") ?? "").trim();
  if (!product_id || !name_ar) return;
  await q(
    `INSERT INTO product_variants (product_id, name_ar, extra_price, in_stock, sort_order)
     VALUES ($1,$2,$3,true,$4)`,
    [product_id, name_ar, Number(form.get("extra_price") || 0), Number(form.get("sort_order") || 100)]
  );
  revalidatePath(`/admin/products/${product_id}`);
  revalidatePath("/", "layout");
}

export async function deleteVariant(form: FormData) {
  await guard();
  const id = Number(form.get("id"));
  const v = await q1<{ product_id: number }>(`SELECT product_id FROM product_variants WHERE id=$1`, [id]);
  await q(`DELETE FROM product_variants WHERE id = $1`, [id]);
  if (v) revalidatePath(`/admin/products/${v.product_id}`);
  revalidatePath("/", "layout");
}

export async function addProductImage(form: FormData) {
  await guard();
  const product_id = Number(form.get("product_id"));
  const file = form.get("image") as File | null;
  if (!product_id || !file || file.size === 0) return;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!["png", "jpg", "jpeg", "webp"].includes(ext)) return;
  const dir = path.join(process.cwd(), "public", "products");
  await mkdir(dir, { recursive: true });
  const nm = `p${product_id}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, nm), Buffer.from(await file.arrayBuffer()));
  await q(`INSERT INTO product_images (product_id, path) VALUES ($1,$2)`, [product_id, `/products/${nm}`]);
  revalidatePath(`/admin/products/${product_id}`);
  revalidatePath("/", "layout");
}

export async function deleteProductImage(form: FormData) {
  await guard();
  const id = Number(form.get("id"));
  const img = await q1<{ product_id: number }>(`SELECT product_id FROM product_images WHERE id=$1`, [id]);
  await q(`DELETE FROM product_images WHERE id = $1`, [id]);
  if (img) revalidatePath(`/admin/products/${img.product_id}`);
  revalidatePath("/", "layout");
}
