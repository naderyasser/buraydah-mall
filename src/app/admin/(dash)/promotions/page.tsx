import { q } from "@/db";
import Riyal from "@/components/Riyal";
import { requireAdmin } from "@/lib/auth";
import { sar } from "@/lib/money";
import { getWings } from "@/lib/queries";
import { savePromotion, deletePromotion, recomputeMerit } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الترقية والتثبيت" };

export default async function PromotionsAdmin() {
  await requireAdmin();
  const [rows, stores, wings, merit] = await Promise.all([
    q<any>(
      `SELECT p.*, s.name_ar AS store, w.name_ar AS wing FROM promotions p
       JOIN stores s ON s.id = p.store_id LEFT JOIN wings w ON w.id = p.wing_id
       ORDER BY (p.ends_on >= current_date) DESC, p.ends_on DESC LIMIT 60`
    ),
    q<any>(`SELECT id, name_ar FROM stores WHERE is_active ORDER BY name_ar`),
    getWings(),
    q<any>(
      `SELECT s.id, s.name_ar, s.merit_pinned, s.badge_year, s.tier,
              round(avg(r.rating) FILTER (WHERE r.status='published'), 1) AS avg,
              count(r.id) FILTER (WHERE r.status='published' AND r.rating >= 4)::int AS good
       FROM stores s LEFT JOIN reviews r ON r.store_id = s.id
       WHERE s.is_active GROUP BY s.id ORDER BY avg DESC NULLS LAST, good DESC LIMIT 20`
    ),
  ]);

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>الترقية والتثبيت</h2>
        <span>نموذج مزدوج: مساحة تُشترى، وتثبيت يُستحقّ بالتقييم</span>
      </div>

      <form action={savePromotion} className="panel form" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>
            المحل
            <select name="store_id" required>
              {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </label>
          <label>
            النوع
            <select name="kind" defaultValue="pin">
              <option value="pin">تثبيت في الصفحة الأولى</option>
              <option value="boost">زيادة الظهور داخل القسم</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>
            القسم (اختياري)
            <select name="wing_id" defaultValue="">
              <option value="">كل المول</option>
              {wings.map((w) => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </label>
          <label>ينتهي في<input name="ends_on" type="date" required dir="ltr" /></label>
        </div>
        <div className="form-grid">
          <label>السعر المتفق عليه (ر.س)<input name="price" type="number" min={0} step="50" dir="ltr" /></label>
          <label>ملاحظة<input name="note" placeholder="اتفاق شهري، فاتورة رقم…" /></label>
        </div>
        <button className="btn btn-brand">احفظ الترقية</button>
        <p className="hint">
          سعر المساحة يختلف بالقسم والموسم حسب الطلب — هذا مصدر دخل لا يحتاج بوابة دفع.
        </p>
      </form>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>النوع</th><th>القسم</th><th>ينتهي</th><th>السعر</th><th></th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} style={{ opacity: new Date(r.ends_on) >= new Date() ? 1 : 0.5 }}>
                <td>{r.store}</td>
                <td>{r.kind === "pin" ? "تثبيت" : "زيادة ظهور"}</td>
                <td>{r.wing ?? "كل المول"}</td>
                <td className="tabular">{new Date(r.ends_on).toLocaleDateString("ar-SA-u-nu-latn")}</td>
                <td className="tabular">{sar(r.price)} <Riyal /></td>
                <td>
                  <form action={deletePromotion}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-line btn-sm">حذف</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}>لا ترقيات بعد.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>التثبيت بالجدارة</h2>
        <form action={recomputeMerit}><button className="btn btn-line btn-sm">أعد الحساب</button></form>
      </div>
      <p className="hint">
        التثبيت المجاني لمن بلغ ٥ تقييمات إيجابية بمعدّل ٤٫٥ فأعلى، وشارة «تاجر
        مميّز» لمن تجاوز ٣٠ تقييماً إيجابياً في السنة — الصفحة الأولى دليل جودة لا مزاد.
      </p>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>المعدّل</th><th>تقييمات إيجابية</th><th>مثبّت بالجدارة</th><th>الشارة</th></tr></thead>
          <tbody>
            {merit.map((m: any) => (
              <tr key={m.id}>
                <td>{m.name_ar}</td>
                <td className="tabular">{m.avg ?? "—"}</td>
                <td className="tabular">{m.good}</td>
                <td>{m.merit_pinned ? "نعم" : "—"}</td>
                <td className="tabular">{m.badge_year ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
