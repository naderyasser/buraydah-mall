import { q, q1 } from "@/db";
import type { Store, Wing } from "./types";

const STORE_COLS = `id, slug, wing_id, name_ar, name_en, logo_path, summary_ar,
  dest_type, dest_value, whatsapp_text, address_line, district, city, map_url,
  phone, hours, tags, tier, sort_order, is_active, data_updated_at,
  is_verified, cr_number, vat_number, maroof_number, returns_policy,
  delivery_fee, free_delivery_over, ready_minutes, hold_days, badge_year,
  merit_pinned, lat, lng`;

/** ترتيب الظهور: المميّز أولاً ثم المدفوع ثم الترتيب اليدوي — هذا ما يُباع للتاجر */
const storeOrder = (p = "") => `ORDER BY
  CASE ${p}tier WHEN 'featured' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END,
  ${p}sort_order, ${p}name_ar`;
const STORE_ORDER = storeOrder();

export function getWings(): Promise<Wing[]> {
  return q<Wing>(
    `SELECT id, slug, name_ar, name_en, tagline, sort_order, is_active
     FROM wings WHERE is_active ORDER BY sort_order, id`
  );
}

export function getWingsWithCounts(): Promise<(Wing & { store_count: number })[]> {
  return q(
    `SELECT w.id, w.slug, w.name_ar, w.name_en, w.tagline, w.sort_order, w.is_active,
            COUNT(s.id) FILTER (WHERE s.is_active)::int AS store_count
     FROM wings w LEFT JOIN stores s ON s.wing_id = w.id
     WHERE w.is_active
     GROUP BY w.id ORDER BY w.sort_order, w.id`
  );
}

export function getWing(slug: string): Promise<Wing | null> {
  return q1<Wing>(`SELECT * FROM wings WHERE slug = $1 AND is_active`, [slug]);
}

export function getStoresByWing(wingId: number): Promise<Store[]> {
  return q<Store>(`SELECT ${STORE_COLS} FROM stores WHERE wing_id = $1 AND is_active ${STORE_ORDER}`, [wingId]);
}

export function getFeaturedStores(limit = 8): Promise<Store[]> {
  return q<Store>(
    `SELECT ${STORE_COLS} FROM stores WHERE is_active AND tier IN ('featured','paid') ${STORE_ORDER} LIMIT $1`,
    [limit]
  );
}

export function getStore(slug: string): Promise<Store | null> {
  return q1<Store>(`SELECT ${STORE_COLS} FROM stores WHERE slug = $1 AND is_active`, [slug]);
}

/** بحث بالاسم العربي والإنجليزي وبوسوم السلع — الميزة على الخرائط */
export function searchStores(term: string): Promise<(Store & { wing_slug: string; wing_name: string })[]> {
  const like = `%${term.trim()}%`;
  return q(
    `SELECT ${STORE_COLS.split(", ").map((c) => "s." + c.trim()).join(", ")},
            w.slug AS wing_slug, w.name_ar AS wing_name
     FROM stores s JOIN wings w ON w.id = s.wing_id
     WHERE s.is_active AND (
       s.name_ar ILIKE $1 OR s.name_en ILIKE $1 OR s.district ILIKE $1
       OR EXISTS (SELECT 1 FROM unnest(s.tags) t WHERE t ILIKE $1)
     )
     ${storeOrder("s.")}
     LIMIT 60`,
    [like]
  );
}

/* ── المنتجات ── */
const P_COLS = `p.id, p.slug, p.store_id, p.name_ar, p.description_ar, p.price,
  p.compare_price, p.image_path, p.unit, p.tags, p.in_stock, p.sort_order, p.is_active,
  p.specs, p.category_id, p.sale_ends_at, p.created_at, p.weight_g`;
const P_JOIN = `FROM products p
  JOIN stores s ON s.id = p.store_id AND s.is_active
  JOIN wings  w ON w.id = s.wing_id  AND w.is_active`;
const P_RATING = `(SELECT round(avg(r.rating), 1) FROM reviews r
    WHERE r.product_id = p.id AND r.status = 'published') AS rating,
  (SELECT count(*)::int FROM reviews r
    WHERE r.product_id = p.id AND r.status = 'published') AS rating_count`;
const P_SEL = `${P_COLS}, p.views, p.variant_label, s.name_ar AS store_name, s.slug AS store_slug, s.district,
  w.slug AS wing_slug, w.name_ar AS wing_name, ${P_RATING}`;
/** المميّز يتقدّم — هذا ما تُباع به المساحة داخل المول */
const P_ORDER = `ORDER BY CASE s.tier WHEN 'featured' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END,
  p.sort_order, p.id`;

export function getFeaturedProducts(limit = 12) {
  return q<any>(`SELECT ${P_SEL} ${P_JOIN} WHERE p.is_active AND p.in_stock ${P_ORDER} LIMIT $1`, [limit]);
}

export function getProductsByWing(wingSlug: string, limit = 60) {
  return q<any>(
    `SELECT ${P_SEL} ${P_JOIN} WHERE p.is_active AND w.slug = $1 ${P_ORDER} LIMIT $2`,
    [wingSlug, limit]
  );
}

export function getProductsByStore(storeId: number) {
  return q<any>(
    `SELECT ${P_SEL} ${P_JOIN} WHERE p.is_active AND p.store_id = $1 ORDER BY p.sort_order, p.id`,
    [storeId]
  );
}

export function getProduct(slug: string) {
  return q1<any>(
    `SELECT ${P_SEL}, (SELECT c.slug FROM categories c WHERE c.id = p.category_id) AS category_slug
     ${P_JOIN} WHERE p.is_active AND p.slug = $1`, [slug]);
}

export function getRelatedProducts(storeId: number, excludeId: number, limit = 4) {
  return q<any>(
    `SELECT ${P_SEL} ${P_JOIN} WHERE p.is_active AND p.store_id = $1 AND p.id <> $2
     ORDER BY p.sort_order LIMIT $3`,
    [storeId, excludeId, limit]
  );
}

/**
 * «منتجات مشابهة» من محلات أخرى (نون/أمازون): نفس التصنيف الفرعي إن وُجد وإلا
 * نفس الجناح، والأقرب سعراً أولاً — هذا ما يجعل المول سوقاً لا كتالوج محل واحد.
 */
export function getSimilarProducts(p: { id: number; store_id: number; category_id: number | null; price: number | string; wing_slug: string }, limit = 4) {
  return q<any>(
    `SELECT ${P_SEL} ${P_JOIN} WHERE p.is_active AND p.in_stock AND p.id <> $1 AND p.store_id <> $2
       AND ($3::int IS NULL OR p.category_id = $3) AND w.slug = $4
     ORDER BY abs(p.price - $5::numeric), p.sort_order LIMIT $6`,
    [p.id, p.store_id, p.category_id, p.wing_slug, Number(p.price), limit]
  );
}

/** اقتراحات البحث الفورية: منتجات ومحلات وتصنيفات — ٥ من كل نوع تكفي قائمة منسدلة */
export async function suggest(term: string) {
  const like = `%${term.trim()}%`;
  const [products, stores, categories] = await Promise.all([
    q<any>(
      `SELECT p.name_ar, p.slug, p.price, p.image_path, s.name_ar AS store_name
       FROM products p JOIN stores s ON s.id = p.store_id AND s.is_active
       WHERE p.is_active AND p.name_ar ILIKE $1
       ORDER BY p.views DESC, p.sort_order LIMIT 5`, [like]),
    q<any>(`SELECT name_ar, slug, district FROM stores WHERE is_active AND name_ar ILIKE $1 ORDER BY tier, sort_order LIMIT 3`, [like]),
    q<any>(
      `SELECT c.name_ar, c.slug, w.slug AS wing_slug, w.name_ar AS wing_name
       FROM categories c JOIN wings w ON w.id = c.wing_id
       WHERE c.is_active AND c.name_ar ILIKE $1 ORDER BY c.sort_order LIMIT 3`, [like]),
  ]);
  return { products, stores, categories };
}

/** بحث في المنتجات بالاسم والوصف والوسوم واسم المحل */
export function searchProducts(term: string) {
  const like = `%${term.trim()}%`; // مصطلح فارغ = كل المنتجات
  return q<any>(
    `SELECT ${P_SEL} ${P_JOIN}
     WHERE p.is_active AND (
       p.name_ar ILIKE $1 OR p.description_ar ILIKE $1 OR s.name_ar ILIKE $1
       OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE $1)
     ) ${P_ORDER} LIMIT 60`,
    [like]
  );
}

/* ── عدّاد الزوار (عام) ── */
export async function getVisitorStats(): Promise<{ total: number; today: number }> {
  const row = await q1<{ total: number; today: number }>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Riyadh'))::int AS today
     FROM visits`
  );
  return row ?? { total: 0, today: 0 };
}

/* ── الفهرس: الأقسام والماركات ── */
export function getWingIndex() {
  return q<any>(
    `SELECT w.id, w.slug, w.name_ar, w.tagline,
            count(DISTINCT s.id)::int AS brand_count,
            count(DISTINCT s.id) FILTER (WHERE pc.n > 0)::int AS selling_count,
            (SELECT p.image_path FROM products p
               JOIN stores s2 ON s2.id = p.store_id
              WHERE s2.wing_id = w.id AND p.is_active AND p.image_path IS NOT NULL
              ORDER BY p.sort_order LIMIT 1) AS cover
     FROM wings w
     LEFT JOIN stores s ON s.wing_id = w.id AND s.is_active
     LEFT JOIN LATERAL (SELECT count(*) n FROM products p
                        WHERE p.store_id = s.id AND p.is_active) pc ON true
     WHERE w.is_active
     GROUP BY w.id ORDER BY w.sort_order, w.id`
  );
}

/** كل ماركة مع عدد منتجاتها — صفر يعني «دليل فقط» فالضغط يحوّل مباشرة */
export function getBrands(wingSlug?: string) {
  return q<any>(
    `SELECT s.id, s.slug, s.name_ar, s.logo_path, s.district, s.tier, s.dest_type, s.summary_ar,
            w.slug AS wing_slug, w.name_ar AS wing_name,
            (SELECT count(*)::int FROM products p WHERE p.store_id = s.id AND p.is_active) AS product_count,
            coalesce((SELECT array_agg(pr.image_path ORDER BY pr.sort_order) FROM (
               SELECT image_path, sort_order FROM products WHERE store_id = s.id AND is_active AND image_path IS NOT NULL ORDER BY sort_order LIMIT 2) pr), '{}') AS sample_images
     FROM stores s JOIN wings w ON w.id = s.wing_id AND w.is_active
     WHERE s.is_active ${wingSlug ? "AND w.slug = $1" : ""}
     ORDER BY CASE s.tier WHEN 'featured' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END,
              (SELECT count(*) FROM products p WHERE p.store_id = s.id AND p.is_active) DESC,
              s.sort_order, s.name_ar`,
    wingSlug ? [wingSlug] : []
  );
}
