import { pool } from "@/db";
import { parseCsv, pick } from "@/lib/csv";

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const yes = (v: string) => !/^(لا|no|0|false|غير متوفر|غير متوفّر)$/i.test(v.trim()) ;

export type ImportResult = { inserted: number; skipped: number; errors: string[] };

/**
 * استيراد منتجات من CSV لمحل واحد. يُدرج فقط (لا يعدّل): الاسم المكرّر داخل نفس
 * المحل يُتخطّى كي لا تُمسح أسعار عدّلها التاجر يدوياً. التصنيف يُطابَق بالاسم
 * أو الـslug داخل جناح المحل، والخيارات بصيغة «اسم:فرق السعر;…».
 */
export async function importProductsCsv(storeId: number, text: string): Promise<ImportResult> {
  const rows = parseCsv(text);
  const res: ImportResult = { inserted: 0, skipped: 0, errors: [] };
  if (rows.length === 0) { res.errors.push("الملف فارغ أو بلا صفّ عناوين."); return res; }
  const c = await pool.connect();
  try {
    const { rows: [store] } = await c.query(`SELECT id, wing_id FROM stores WHERE id = $1`, [storeId]);
    if (!store) { res.errors.push("المحل غير موجود."); return res; }
    const { rows: cats } = await c.query(`SELECT id, slug, name_ar FROM categories WHERE wing_id = $1 AND is_active`, [store.wing_id]);
    await c.query("BEGIN");
    for (const [i, r] of rows.entries()) {
      const line = i + 2;
      const name = pick(r, "name"); const price = Number(String(pick(r, "price")).replace(/[^\d.]/g, ""));
      if (!name || !(price > 0)) { res.errors.push(`سطر ${line}: الاسم أو السعر ناقص.`); res.skipped++; continue; }
      const dup = await c.query(`SELECT 1 FROM products WHERE store_id = $1 AND name_ar = $2`, [storeId, name]);
      if (dup.rowCount) { res.skipped++; continue; }
      const catName = pick(r, "category").trim();
      const cat = catName ? cats.find((x: any) => x.name_ar === catName || x.slug === slugify(catName)) : null;
      if (catName && !cat) res.errors.push(`سطر ${line}: التصنيف «${catName}» غير موجود في جناح محلك — أُدرج بلا تصنيف.`);
      const cmp = Number(String(pick(r, "compare_price")).replace(/[^\d.]/g, "")) || null;
      const tags = pick(r, "tags").split(/[,،;]/).map((t) => t.trim()).filter(Boolean);
      const image = pick(r, "image"); const imagePath = /^https?:\/\//.test(image) || image.startsWith("/") ? image : null;
      let slug = slugify(name) || `p-${storeId}-${Date.now().toString(36)}`;
      const taken = await c.query(`SELECT 1 FROM products WHERE slug = $1`, [slug]);
      if (taken.rowCount) slug = `${slug}-${storeId}-${Math.random().toString(36).slice(2, 6)}`;
      const ins = await c.query(
        `INSERT INTO products (slug, store_id, name_ar, description_ar, price, compare_price, image_path, unit, tags, in_stock,
                               sort_order, is_active, category_id, variant_label, specs)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,100,true,$11,$12,'[]'::jsonb) RETURNING id`,
        [slug, storeId, name, pick(r, "description") || null, price, cmp && cmp > price ? cmp : null, imagePath,
         pick(r, "unit") || null, tags, yes(pick(r, "in_stock") || "نعم"), cat?.id ?? null, pick(r, "variant_label") || null]
      );
      const variants = pick(r, "variants");
      if (variants) {
        for (const [j, v] of variants.split(";").entries()) {
          const [vn, ve] = v.split(":"); if (!vn?.trim()) continue;
          await c.query(`INSERT INTO product_variants (product_id, name_ar, extra_price, in_stock, sort_order) VALUES ($1,$2,$3,true,$4)`,
            [ins.rows[0].id, vn.trim(), Number(ve) || 0, j]);
        }
      }
      res.inserted++;
    }
    await c.query("COMMIT");
  } catch (e: any) {
    await c.query("ROLLBACK");
    res.errors.push("فشل الاستيراد كله: " + (e?.message ?? "خطأ غير معروف"));
    res.inserted = 0;
  } finally { c.release(); }
  return res;
}
