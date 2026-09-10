import { q } from "@/db";
import { saveCoupon, toggleCoupon } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الكوبونات" };

export default async function CouponsAdmin() {
  const [rows, stores] = await Promise.all([
    q<any>(
      `SELECT c.*, s.name_ar AS store FROM coupons c
       LEFT JOIN stores s ON s.id = c.store_id ORDER BY c.is_active DESC, c.id DESC`
    ),
    q<any>(`SELECT id, name_ar FROM stores WHERE is_active ORDER BY name_ar`),
  ]);

  return (
    <div className="wrap" style={{ maxWidth: 980 }}>
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>الكوبونات ({rows.length})</h2>
        <span>خصم يلتزم به المحل عند الاستلام — لا خصم على بطاقة</span>
      </div>

      <form action={saveCoupon} className="panel form" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>الرمز<input name="code" required dir="ltr" placeholder="BURAYDAH10" /></label>
          <label>
            النوع
            <select name="kind" defaultValue="percent">
              <option value="percent">نسبة %</option>
              <option value="amount">مبلغ ر.س</option>
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>القيمة<input name="value" type="number" step="0.5" min={0} required dir="ltr" /></label>
          <label>حد أدنى للطلب<input name="min_total" type="number" step="1" min={0} defaultValue={0} dir="ltr" /></label>
        </div>
        <div className="form-grid">
          <label>
            المحل (اتركه فارغاً = كل المول)
            <select name="store_id" defaultValue="">
              <option value="">كل المول</option>
              {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </label>
          <label>حد الاستخدام<input name="max_uses" type="number" min={1} dir="ltr" placeholder="بلا حد" /></label>
        </div>
        <label>ينتهي في<input name="expires_on" type="date" dir="ltr" /></label>
        <button className="btn btn-brand">احفظ الكوبون</button>
      </form>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>الرمز</th><th>الخصم</th><th>المحل</th><th>حد أدنى</th><th>استُخدم</th><th>ينتهي</th><th>الحالة</th></tr></thead>
          <tbody>
            {rows.map((c: any) => (
              <tr key={c.id} style={{ opacity: c.is_active ? 1 : 0.5 }}>
                <td className="tabular" dir="ltr">{c.code}</td>
                <td className="tabular">{c.kind === "percent" ? `${Number(c.value)}%` : `${Number(c.value)} ر.س`}</td>
                <td>{c.store ?? "كل المول"}</td>
                <td className="tabular">{Number(c.min_total)}</td>
                <td className="tabular">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="tabular">{c.expires_on ? new Date(c.expires_on).toLocaleDateString("ar-SA-u-nu-latn") : "—"}</td>
                <td>
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn btn-line btn-sm">{c.is_active ? "فعّال" : "موقوف"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}>لا كوبونات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
