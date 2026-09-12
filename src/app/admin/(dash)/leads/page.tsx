import { requireAdmin } from "@/lib/auth";
import { q } from "@/db";
import { agoAr } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات الواردة للماركات" };
const ST: Record<string, string> = { new: "جديد", contacted: "تمّ التواصل", done: "تمّ البيع", spam: "مزعج" };

/** كل الطلبات في المول — الرقم الذي يُباع به المول للمعلنين: «وصل الماركات X طلباً هذا الشهر» */
export default async function LeadsAdmin() {
  await requireAdmin();
  const [rows, [t]] = await Promise.all([
    q<any>(`SELECT l.id, l.customer_name, l.phone, l.district, l.message, l.status, l.source, l.created_at::text AS created_at,
                   s.name_ar AS store, p.name_ar AS product
            FROM leads l JOIN stores s ON s.id = l.store_id LEFT JOIN products p ON p.id = l.product_id
            ORDER BY l.created_at DESC LIMIT 300`),
    q<any>(`SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS m30,
                   count(*) FILTER (WHERE status = 'done')::int AS done, count(DISTINCT store_id)::int AS stores FROM leads`),
  ]);
  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}><h2>الطلبات الواردة للماركات</h2></div>
      <div className="stat-row">
        <div className="stat"><dt>كل الطلبات</dt><dd className="tabular">{t.total}</dd></div>
        <div className="stat"><dt>آخر ٣٠ يوماً</dt><dd className="tabular">{t.m30}</dd></div>
        <div className="stat"><dt>انتهت ببيع</dt><dd className="tabular">{t.done}</dd></div>
        <div className="stat"><dt>ماركات وصلها طلب</dt><dd className="tabular">{t.stores}</dd></div>
      </div>
      <div className="tablewrap"><table className="admin">
        <thead><tr><th>الوقت</th><th>الماركة</th><th>العميل</th><th>الجوال</th><th>المنتج / الطلب</th><th>من صفحة</th><th>الحالة</th></tr></thead>
        <tbody>{rows.map((r: any) => (
          <tr key={r.id}>
            <td className="hint">{agoAr(r.created_at)}</td><td>{r.store}</td><td>{r.customer_name}{r.district ? <><br /><span className="hint">حي {r.district}</span></> : null}</td>
            <td className="tabular" dir="ltr">0{r.phone}</td>
            <td style={{ maxWidth: 260 }}>{r.product && <b>{r.product}</b>}{r.product && r.message ? " — " : ""}{r.message}</td>
            <td className="hint" dir="ltr">{r.source}</td>
            <td><span className={`badge st-${r.status === "new" ? "new" : r.status === "contacted" ? "confirmed" : r.status === "done" ? "done" : "cancelled"}`}>{ST[r.status]}</span></td>
          </tr>))}</tbody>
      </table></div>
      {rows.length === 0 && <p className="hint">لا طلبات بعد.</p>}
    </div>
  );
}
