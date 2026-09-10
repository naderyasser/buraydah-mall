import { q } from "@/db";
import { saveWing } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الأجنحة" };

export default async function WingsAdmin() {
  const wings = await q<any>(
    `SELECT w.*, (SELECT count(*) FROM stores s WHERE s.wing_id = w.id AND s.is_active)::int AS n
     FROM wings w ORDER BY w.sort_order, w.id`
  );

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>الأجنحة</h2>
        <span>الترتيب هنا هو ترتيب الرئيسية</span>
      </div>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>الجناح</th><th>الوصف</th><th>المحلات</th><th>الترتيب</th><th>الحالة</th></tr></thead>
          <tbody>
            {wings.map((w) => (
              <tr key={w.id}>
                <td>{w.name_ar}<br /><span className="hint" dir="ltr">{w.slug}</span></td>
                <td>{w.tagline}</td>
                <td className="tabular">{w.n}</td>
                <td className="tabular">{w.sort_order}</td>
                <td>{w.is_active ? "ظاهر" : "مخفي"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-head"><h2>إضافة جناح</h2></div>
      <form action={saveWing} className="panel form">
        <div className="form-grid">
          <label>الاسم بالعربية *<input name="name_ar" required /></label>
          <label>الاسم بالإنجليزية<input name="name_en" dir="ltr" /></label>
          <label>الرابط الثابت<input name="slug" dir="ltr" placeholder="gold" /></label>
          <label>الترتيب<input name="sort_order" type="number" defaultValue={100} /></label>
        </div>
        <label>وصف قصير<input name="tagline" /></label>
        <label className="chk" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" name="is_active" defaultChecked /> ظاهر
        </label>
        <button className="btn btn-brand">إضافة</button>
      </form>
    </div>
  );
}
