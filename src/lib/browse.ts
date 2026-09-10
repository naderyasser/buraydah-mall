import { q, q1 } from "@/db";
import { SORTS, type SortKey } from "./sorts";

export { SORTS };
export type { SortKey };

/**
 * محرّك التصفّح: قسم، تصنيف فرعي، محل، سعر، توفّر، تخفيض، بحث، وترتيب.
 * صفحة واحدة تخدم /wing و /search و /store — الفلاتر هي ما يحوّل «قائمة
 * منتجات» إلى متجر يُبحث فيه.
 */
export type BrowseOpts = {
  wing?: string;
  category?: string;
  storeId?: number;
  district?: string;
  term?: string;
  min?: number;
  max?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

const ORDER_BY: Record<SortKey, string> = {
  featured: `CASE s.tier WHEN 'featured' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END, p.sort_order, p.id`,
  newest: `p.created_at DESC, p.id DESC`,
  price_asc: `p.price ASC, p.id`,
  price_desc: `p.price DESC, p.id`,
  popular: `p.views DESC, p.sort_order, p.id`,
  rating: `rating DESC NULLS LAST, rating_count DESC, p.sort_order`,
};

function where(o: BrowseOpts) {
  const cond: string[] = ["p.is_active", "s.is_active", "w.is_active"];
  const args: any[] = [];
  const p = (v: any) => `$${args.push(v)}`;

  if (o.wing) cond.push(`w.slug = ${p(o.wing)}`);
  if (o.category) cond.push(`c.slug = ${p(o.category)}`);
  if (o.storeId) cond.push(`p.store_id = ${p(o.storeId)}`);
  if (o.district) cond.push(`s.district = ${p(o.district)}`);
  if (o.min != null) cond.push(`p.price >= ${p(o.min)}`);
  if (o.max != null) cond.push(`p.price <= ${p(o.max)}`);
  if (o.inStock) cond.push("p.in_stock");
  if (o.onSale) cond.push("p.compare_price IS NOT NULL AND p.compare_price > p.price");

  const term = o.term?.trim();
  if (term) {
    const t = p(`%${term}%`);
    cond.push(`(p.name_ar ILIKE ${t} OR p.description_ar ILIKE ${t} OR s.name_ar ILIKE ${t}
      OR EXISTS (SELECT 1 FROM unnest(p.tags) g WHERE g ILIKE ${t}))`);
  }
  return { sql: cond.join(" AND "), args };
}

const JOINS = `FROM products p
  JOIN stores s ON s.id = p.store_id
  JOIN wings  w ON w.id = s.wing_id
  LEFT JOIN categories c ON c.id = p.category_id`;

const SELECT = `p.id, p.slug, p.store_id, p.name_ar, p.description_ar, p.price,
  p.compare_price, p.image_path, p.unit, p.tags, p.in_stock, p.sort_order,
  p.is_active, p.views, p.variant_label, p.created_at,
  s.name_ar AS store_name, s.slug AS store_slug, s.district,
  w.slug AS wing_slug, w.name_ar AS wing_name,
  c.slug AS category_slug, c.name_ar AS category_name,
  (SELECT round(avg(r.rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='published') AS rating,
  (SELECT count(*)::int FROM reviews r WHERE r.product_id = p.id AND r.status='published') AS rating_count`;

export async function browseProducts(o: BrowseOpts) {
  const { sql, args } = where(o);
  const perPage = Number.isFinite(o.perPage) ? Math.min(Math.max(6, o.perPage!), 60) : 24;
  const page = Number.isFinite(o.page) ? Math.max(1, Math.floor(o.page!)) : 1;
  const order = ORDER_BY[o.sort ?? "featured"];

  const [rows, count] = await Promise.all([
    q<any>(
      `SELECT ${SELECT} ${JOINS} WHERE ${sql} ORDER BY ${order} LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
      args
    ),
    q1<{ n: number }>(`SELECT count(*)::int AS n ${JOINS} WHERE ${sql}`, args),
  ]);

  const total = count?.n ?? 0;
  return { rows, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** ما يُبنى منه شريط الفلاتر: التصنيفات والمحلات وحدود السعر ضمن النتيجة نفسها */
export async function getFacets(o: BrowseOpts) {
  const base: BrowseOpts = { ...o, category: undefined, min: undefined, max: undefined, district: undefined };
  const { sql, args } = where(base);

  const [categories, stores, districts, bounds] = await Promise.all([
    q<any>(
      `SELECT c.slug, c.name_ar, count(*)::int AS n ${JOINS} WHERE ${sql} AND c.id IS NOT NULL
       GROUP BY c.id, c.slug, c.name_ar ORDER BY c.sort_order, n DESC`,
      args
    ),
    q<any>(
      `SELECT s.slug, s.name_ar, s.id, count(*)::int AS n ${JOINS} WHERE ${sql}
       GROUP BY s.id, s.slug, s.name_ar ORDER BY n DESC, s.name_ar LIMIT 20`,
      args
    ),
    q<any>(
      `SELECT s.district, count(*)::int AS n ${JOINS} WHERE ${sql} AND s.district IS NOT NULL
       GROUP BY s.district ORDER BY n DESC, s.district`,
      args
    ),
    q1<any>(
      `SELECT min(p.price)::int AS lo, max(p.price)::int AS hi, count(*)::int AS n,
              count(*) FILTER (WHERE p.compare_price > p.price)::int AS on_sale
       ${JOINS} WHERE ${sql}`,
      args
    ),
  ]);

  return { categories, stores, districts, bounds: bounds ?? { lo: 0, hi: 0, n: 0, on_sale: 0 } };
}

/* ── واجهات جاهزة تبني الصفحة الرئيسية ── */

/** الأكثر مبيعاً فعلاً — من سطور الطلبات لا من تخمين */
export function getBestSellers(limit = 10) {
  return q<any>(
    `SELECT ${SELECT}, coalesce(sold.n, 0)::int AS sold
     ${JOINS}
     JOIN LATERAL (
       SELECT sum(oi.qty) AS n FROM order_items oi
       WHERE oi.product_id = p.id AND oi.status <> 'cancelled'
     ) sold ON true
     WHERE p.is_active AND s.is_active AND w.is_active AND coalesce(sold.n,0) > 0
     ORDER BY sold.n DESC, p.views DESC LIMIT $1`,
    [limit]
  );
}

export function getMostViewed(limit = 10) {
  return q<any>(
    `SELECT ${SELECT} ${JOINS}
     WHERE p.is_active AND s.is_active AND w.is_active AND p.views > 0
     ORDER BY p.views DESC, p.sort_order LIMIT $1`,
    [limit]
  );
}

export function getOnSale(limit = 10) {
  return q<any>(
    `SELECT ${SELECT} ${JOINS}
     WHERE p.is_active AND s.is_active AND w.is_active
       AND p.compare_price IS NOT NULL AND p.compare_price > p.price
     ORDER BY (p.compare_price - p.price) / p.compare_price DESC LIMIT $1`,
    [limit]
  );
}

export function getNewArrivals(limit = 10) {
  return q<any>(
    `SELECT ${SELECT} ${JOINS}
     WHERE p.is_active AND s.is_active AND w.is_active
     ORDER BY p.created_at DESC, p.id DESC LIMIT $1`,
    [limit]
  );
}

export function getProductsByIds(ids: number[]) {
  if (!ids.length) return Promise.resolve([]);
  return q<any>(
    `SELECT ${SELECT} ${JOINS} WHERE p.is_active AND s.is_active AND p.id = ANY($1)`,
    [ids]
  );
}

/** ما يبحث عنه أهل بريدة — يُعرض للزائر ويُقرأ في اللوحة */
export function getTrendingSearches(limit = 8) {
  return q<{ term: string; n: number }>(
    `SELECT term, count(*)::int AS n FROM searches
     WHERE created_at > now() - interval '30 days' AND results > 0
     GROUP BY term ORDER BY n DESC, max(created_at) DESC LIMIT $1`,
    [limit]
  );
}

export function getCategories(wingSlug?: string) {
  return q<any>(
    `SELECT c.id, c.slug, c.name_ar, c.wing_id, w.slug AS wing_slug,
            (SELECT count(*)::int FROM products p WHERE p.category_id = c.id AND p.is_active) AS n
     FROM categories c JOIN wings w ON w.id = c.wing_id
     WHERE c.is_active ${wingSlug ? "AND w.slug = $1" : ""}
     ORDER BY c.sort_order, c.name_ar`,
    wingSlug ? [wingSlug] : []
  );
}
