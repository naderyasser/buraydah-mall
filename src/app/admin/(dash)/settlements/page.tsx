import { q } from "@/db";
import { sar } from "@/lib/money";
import { generateSettlements, setSettlementStatus, setStoreCommission } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "التسويات والعمولة" };

const ST: Record<string, string> = { draft: "قيد الإعداد", sent: "أُرسلت", paid: "مسدَّدة" };

export default async function SettlementsAdmin() {
  const [rows, stores] = await Promise.all([
    q<any>(
      `SELECT st.*, s.name_ar AS store FROM settlements st JOIN stores s ON s.id = st.store_id
       ORDER BY st.period_start DESC, s.name_ar LIMIT 100`
    ),
    q<any>(
      `SELECT s.id, s.name_ar, s.commission_pct,
              coalesce((SELECT sum(oi.price*oi.qty) FROM order_items oi
                        WHERE oi.store_id = s.id AND oi.status = 'done'), 0) AS lifetime
       FROM stores s WHERE s.is_active ORDER BY lifetime DESC, s.name_ar`
    ),
  ]);

  const thisMonth = new Date();
  const monthValue = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, "0")}-01`;

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>التسويات والعمولة</h2>
        <span>مع الدفع عند الاستلام: المحل يحصّل ويورّد العمولة</span>
      </div>

      <form action={generateSettlements} className="panel form" style={{ marginBottom: 20 }}>
        <label>أصدر كشوف شهر<input name="month" type="date" defaultValue={monthValue} dir="ltr" /></label>
        <button className="btn btn-brand">أصدر الكشوف</button>
        <p className="hint">
          تُحتسب على الطلبات <b>المسلّمة فقط</b> — لا المؤكَّدة ولا الملغاة، وهذا ما
          يجعل الرقم قابلاً للمطالبة به.
        </p>
      </form>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>الفترة</th><th>المبيعات</th><th>العمولة</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td>{r.store}</td>
                <td className="tabular">{new Date(r.period_start).toLocaleDateString("ar-SA-u-nu-latn")}</td>
                <td className="tabular">{sar(r.gross)} ر.س</td>
                <td className="tabular">{sar(r.commission)} ر.س</td>
                <td>{ST[r.status]}</td>
                <td>
                  <form action={setSettlementStatus} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status}
                      style={{ padding: "4px 8px", fontSize: 13, background: "var(--card)",
                               color: "var(--ink)", border: "1px solid var(--line-2)", borderRadius: 4 }}>
                      {Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn btn-line btn-sm">حفظ</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6}>لا كشوف بعد.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>نسبة العمولة لكل محل</h2>
        <span>الصفر يعني مجاناً — وهو المناسب للسنة الأولى</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>مبيعات مسلّمة</th><th>العمولة %</th><th></th></tr></thead>
          <tbody>
            {stores.map((s: any) => (
              <tr key={s.id}>
                <td>{s.name_ar}</td>
                <td className="tabular">{sar(s.lifetime)} ر.س</td>
                <td className="tabular">{Number(s.commission_pct)}%</td>
                <td>
                  <form action={setStoreCommission} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={s.id} />
                    <input name="commission_pct" type="number" min={0} max={30} step="0.5"
                      defaultValue={Number(s.commission_pct)} dir="ltr"
                      style={{ width: 80, padding: "4px 8px", fontSize: 13,
                               border: "1px solid var(--line-2)", borderRadius: 4 }} />
                    <button className="btn btn-line btn-sm">حفظ</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
