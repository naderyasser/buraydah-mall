import { q } from "@/db";
import { togglePhoneBlock } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الأرقام الموقوفة" };

export default async function FlagsAdmin() {
  const rows = await q<any>(
    `SELECT f.*, (SELECT count(*)::int FROM orders o
                   WHERE regexp_replace(o.phone,'[^0-9]','','g') = f.phone) AS orders
     FROM phone_flags f ORDER BY f.is_blocked DESC, f.refusals DESC LIMIT 200`
  );

  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>الأرقام الموقوفة ({rows.length})</h2>
        <span>حماية الدفع عند الاستلام — قائمة داخلية لا تُنشر</span>
      </div>

      <p className="hint">
        آفة الدفع عند الاستلام الأولى هي رفض الاستلام المتكرّر: الطلب يُجهَّز ويُوصَّل
        ثم يُرفض، فيتحمّل المحل الكلفة. يُسجَّل الرفض من صفحة الطلبات، ويُحظر الرقم
        تلقائياً عند الرفض الثاني. <b>لا تُنشر هذه القائمة</b> — نشر أرقام الناس
        مخاطرة على الخصوصية وعلى سمعة المول.
      </p>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>الجوال</th><th>مرات الرفض</th><th>طلباته</th><th>السبب</th><th>الحالة</th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.phone}>
                <td className="tabular" dir="ltr">{r.phone}</td>
                <td className="tabular">{r.refusals}</td>
                <td className="tabular">{r.orders}</td>
                <td>{r.reason ?? "—"}</td>
                <td>
                  <form action={togglePhoneBlock}>
                    <input type="hidden" name="phone" value={r.phone} />
                    <button className="btn btn-line btn-sm">{r.is_blocked ? "موقوف" : "مسموح"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5}>لا أرقام موقوفة — وهذا هو الوضع الطبيعي.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
