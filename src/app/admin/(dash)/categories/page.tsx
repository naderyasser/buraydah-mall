import { q } from "@/db";
import { getWings } from "@/lib/queries";
import { saveCategory, deleteCategory } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "التصنيفات" };

export default async function CategoriesAdmin() {
  const [rows, wings] = await Promise.all([
    q<any>(
      `SELECT c.*, w.name_ar AS wing,
              (SELECT count(*)::int FROM products p WHERE p.category_id = c.id) AS n
       FROM categories c JOIN wings w ON w.id = c.wing_id
       ORDER BY w.sort_order, c.sort_order, c.name_ar`
    ),
    getWings(),
  ]);

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>التصنيفات الفرعية ({rows.length})</h2>
        <span>تحت كل قسم — هي ما يصفّي به الزائر النتائج</span>
      </div>

      <form action={saveCategory} className="panel form" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>الاسم<input name="name_ar" required placeholder="خواتم" /></label>
          <label>
            القسم
            <select name="wing_id" required>
              {wings.map((w) => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>الرابط (اختياري)<input name="slug" dir="ltr" placeholder="rings" /></label>
          <label>الترتيب<input name="sort_order" type="number" defaultValue={100} dir="ltr" /></label>
        </div>
        <button className="btn btn-brand">أضف تصنيفاً</button>
      </form>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>التصنيف</th><th>القسم</th><th>الرابط</th><th>منتجات</th><th></th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td>{r.name_ar}</td>
                <td>{r.wing}</td>
                <td className="tabular" dir="ltr">{r.slug}</td>
                <td className="tabular">{r.n}</td>
                <td>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-line btn-sm">حذف</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>لا تصنيفات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
