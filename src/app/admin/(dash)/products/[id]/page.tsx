import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { q1 } from "@/db";
import { getWings } from "@/lib/queries";
import { q } from "@/db";
import {
  saveProduct, saveVariant, deleteVariant, addProductImage, deleteProductImage,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل منتج" };

export default async function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await q1<any>(`SELECT * FROM products WHERE id = $1`, [Number(id)]);
  if (!isNew && !p) notFound();
  const [stores, cats, variants, images] = await Promise.all([
    q<any>(
      `SELECT s.id, s.name_ar, w.name_ar AS wing FROM stores s JOIN wings w ON w.id = s.wing_id
       WHERE s.is_active ORDER BY w.sort_order, s.name_ar`
    ),
    q<any>(
      `SELECT c.id, c.name_ar, w.name_ar AS wing FROM categories c JOIN wings w ON w.id = c.wing_id
       WHERE c.is_active ORDER BY w.sort_order, c.sort_order`
    ),
    isNew ? Promise.resolve([]) : q<any>(
      `SELECT id, name_ar, extra_price, in_stock FROM product_variants
       WHERE product_id = $1 ORDER BY sort_order, id`, [Number(id)]
    ),
    isNew ? Promise.resolve([]) : q<any>(
      `SELECT id, path FROM product_images WHERE product_id = $1 ORDER BY sort_order, id`, [Number(id)]
    ),
  ]);

  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      <nav className="crumbs"><Link href="/admin/products">المنتجات</Link> ‹ {isNew ? "منتج جديد" : p.name_ar}</nav>
      <h1 style={{ fontSize: 26, marginTop: 14 }}>{isNew ? "إضافة منتج" : p.name_ar}</h1>

      <form action={saveProduct} className="panel form" style={{ marginTop: 20 }}>
        {!isNew && <input type="hidden" name="id" value={p.id} />}
        {!isNew && <input type="hidden" name="image_path" value={p.image_path ?? ""} />}

        <div className="form-grid">
          <label>اسم المنتج *<input name="name_ar" required defaultValue={p?.name_ar ?? ""} /></label>
          <label>
            المحل *
            <select name="store_id" required defaultValue={p?.store_id ?? ""}>
              <option value="">— اختر —</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name_ar} — {s.wing}</option>)}
            </select>
          </label>
          <label>السعر (ر.س) *<input name="price" type="number" step="0.01" required defaultValue={p?.price ?? ""} /></label>
          <label>السعر قبل الخصم<input name="compare_price" type="number" step="0.01" defaultValue={p?.compare_price ?? ""} /></label>
          <label>ينتهي العرض في<input name="sale_ends_at" type="datetime-local"
            defaultValue={p?.sale_ends_at ? new Date(p.sale_ends_at).toLocaleString("sv-SE", { timeZone: "Asia/Riyadh" }).slice(0, 16).replace(" ", "T") : ""} /></label>
          <label>الوحدة<input name="unit" defaultValue={p?.unit ?? ""} placeholder="للقطعة، للمتر، للجرام" /></label>
          <label>ترتيب الظهور<input name="sort_order" type="number" defaultValue={p?.sort_order ?? 100} /></label>
          <label>
            التصنيف الفرعي
            <select name="category_id" defaultValue={p?.category_id ?? ""}>
              <option value="">— بلا تصنيف —</option>
              {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name_ar} — {c.wing}</option>)}
            </select>
          </label>
          <label>
            محور الخيارات
            <input name="variant_label" defaultValue={p?.variant_label ?? ""} placeholder="المقاس / العيار / اللون" />
          </label>
        </div>

        <label>الوصف<textarea name="description_ar" rows={2} defaultValue={p?.description_ar ?? ""} /></label>
        <label>
          المواصفات
          <textarea name="specs" rows={4}
            defaultValue={(p?.specs ?? []).map((x: any) => `${x.k}: ${x.v}`).join("\n")}
            placeholder={"العيار: 21\nالوزن: 12 جرام\nالطول: 45 سم"} />
          <span className="hint">سطر لكل مواصفة بصيغة «الاسم: القيمة» — تظهر جدولاً في صفحة المنتج.</span>
        </label>
        <label>
          الوسوم<input name="tags" defaultValue={p?.tags?.join("، ") ?? ""} placeholder="فساتين سهرة، تطريز" />
          <span className="hint">افصل بينها بفاصلة — هذه ما يبحث به الناس.</span>
        </label>
        <label>
          الصورة<input name="image" type="file" accept="image/png,image/jpeg,image/webp" />
          <span className="hint">{p?.image_path ? `الحالية: ${p.image_path}` : "مربّعة يُفضَّل 700×700."}</span>
        </label>

        <label className="chk"><input type="checkbox" name="in_stock" defaultChecked={p?.in_stock ?? true} /> متوفّر</label>
        <label className="chk"><input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} /> معروض في الموقع</label>

        <button className="btn btn-gold" type="submit">حفظ</button>
      </form>

      {!isNew && (
        <>
          <div className="section-head" style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: 17 }}>خيارات المنتج</h3>
            <span>{p.variant_label || "بلا محور"} — مقاسات أو أعيرة أو ألوان</span>
          </div>
          <div className="tablewrap">
            <table className="admin">
              <thead><tr><th>الخيار</th><th>فرق السعر</th><th></th></tr></thead>
              <tbody>
                {variants.map((v: any) => (
                  <tr key={v.id}>
                    <td>{v.name_ar}</td>
                    <td className="tabular">{Number(v.extra_price)}</td>
                    <td>
                      <form action={deleteVariant}>
                        <input type="hidden" name="id" value={v.id} />
                        <button className="btn btn-line btn-sm">حذف</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {variants.length === 0 && <tr><td colSpan={3}>بلا خيارات — يُباع كقطعة واحدة.</td></tr>}
              </tbody>
            </table>
          </div>
          <form action={saveVariant} className="panel form" style={{ marginTop: 12 }}>
            <input type="hidden" name="product_id" value={p.id} />
            <div className="form-grid">
              <label>اسم الخيار<input name="name_ar" required placeholder="مقاس 40" /></label>
              <label>فرق السعر (ر.س)<input name="extra_price" type="number" step="0.5" defaultValue={0} dir="ltr" /></label>
            </div>
            <button className="btn btn-line">أضف خياراً</button>
          </form>

          <div className="section-head" style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: 17 }}>صور إضافية</h3>
            <span>الصورة الرئيسية أعلاه، وهذه معرض المنتج</span>
          </div>
          <div className="admin-gallery">
            {images.map((im: any) => (
              <div key={im.id}>
                <img src={im.path} alt="" />
                <form action={deleteProductImage}>
                  <input type="hidden" name="id" value={im.id} />
                  <button className="btn btn-line btn-sm">حذف</button>
                </form>
              </div>
            ))}
            {images.length === 0 && <p className="hint">لا صور إضافية.</p>}
          </div>
          <form action={addProductImage} className="panel form" style={{ marginTop: 12 }}>
            <input type="hidden" name="product_id" value={p.id} />
            <label>صورة جديدة<input name="image" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
            <button className="btn btn-line">أضف الصورة</button>
          </form>
        </>
      )}
    </div>
  );
}
