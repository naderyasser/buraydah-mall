import Link from "next/link";
import { notFound } from "next/navigation";
import { q1 } from "@/db";
import { getWings } from "@/lib/queries";
import { q } from "@/db";
import { saveProduct } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل منتج" };

export default async function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await q1<any>(`SELECT * FROM products WHERE id = $1`, [Number(id)]);
  if (!isNew && !p) notFound();
  const stores = await q<any>(
    `SELECT s.id, s.name_ar, w.name_ar AS wing FROM stores s JOIN wings w ON w.id = s.wing_id
     WHERE s.is_active ORDER BY w.sort_order, s.name_ar`
  );

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
          <label>الوحدة<input name="unit" defaultValue={p?.unit ?? ""} placeholder="للقطعة، للمتر، للجرام" /></label>
          <label>ترتيب الظهور<input name="sort_order" type="number" defaultValue={p?.sort_order ?? 100} /></label>
        </div>

        <label>الوصف<textarea name="description_ar" rows={2} defaultValue={p?.description_ar ?? ""} /></label>
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
    </div>
  );
}
