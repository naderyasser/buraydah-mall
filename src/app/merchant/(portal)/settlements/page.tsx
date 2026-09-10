import { q } from "@/db";
import { sar } from "@/lib/money";
import { currentStore } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "المحفظة والتسويات", robots: { index: false } };

const ST: Record<string, string> = { draft: "قيد الإعداد", sent: "أُرسلت", paid: "مسدَّدة" };

export default async function MerchantSettlements() {
  const store = (await currentStore())!;
  const pct = Number(store.commission_pct ?? 0);

  const [rows, [live]] = await Promise.all([
    q<any>(
      `SELECT * FROM settlements WHERE store_id = $1 ORDER BY period_end DESC LIMIT 24`,
      [store.id]
    ),
    q<any>(
      `SELECT coalesce(sum(oi.price * oi.qty), 0) AS gross,
              count(DISTINCT oi.order_id)::int AS orders
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE oi.store_id = $1 AND oi.status = 'done'
         AND o.created_at >= date_trunc('month', now())`,
      [store.id]
    ),
  ]);

  const gross = Number(live?.gross ?? 0);
  const commission = Math.round(gross * pct) / 100;

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>المحفظة والتسويات</h2>
        <span>الدفع عند الاستلام: أنت تحصّل، وتورّد العمولة للمول</span>
      </div>

      <dl className="stat-row">
        <div className="stat"><dt>مبيعات هذا الشهر (مسلّمة)</dt><dd>{sar(gross)}<small> ر.س</small></dd></div>
        <div className="stat"><dt>نسبة عمولة المول</dt><dd>{pct}<small>%</small></dd></div>
        <div className="stat"><dt>العمولة المستحقّة</dt><dd>{sar(commission)}<small> ر.س</small></dd></div>
        <div className="stat"><dt>طلبات مسلّمة</dt><dd>{live?.orders ?? 0}</dd></div>
      </dl>

      <p className="hint" style={{ marginTop: 10 }}>
        تُحتسب العمولة على الطلبات <b>المسلّمة فقط</b> — لا على الطلب المؤكَّد ولا الملغى.
        {pct === 0 && " عمولتك صفر حالياً: السنة الأولى مجانية."}
      </p>

      <div className="section-head" style={{ marginTop: 30 }}>
        <h3 style={{ fontSize: 17 }}>كشوف سابقة</h3>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>الفترة</th><th>المبيعات</th><th>العمولة</th><th>الصافي لك</th><th>الحالة</th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td className="tabular">
                  {new Date(r.period_start).toLocaleDateString("ar-SA-u-nu-latn")} —{" "}
                  {new Date(r.period_end).toLocaleDateString("ar-SA-u-nu-latn")}
                </td>
                <td className="tabular">{sar(r.gross)} ر.س</td>
                <td className="tabular">{sar(r.commission)} ر.س</td>
                <td className="tabular">{sar(Number(r.gross) - Number(r.commission))} ر.س</td>
                <td>{ST[r.status]}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>لا كشوف بعد — أول كشف يصدر نهاية الشهر.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
