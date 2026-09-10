import Link from "next/link";
import { q } from "@/db";
import { setRequestStatus, setReportStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات والبلاغات" };

const REQ_STATUS: Record<string, string> = {
  new: "جديد", contacted: "تم التواصل", published: "نُشر", rejected: "مرفوض",
};

export default async function RequestsAdmin() {
  const [requests, reports] = await Promise.all([
    q<any>(
      `SELECT r.*, w.name_ar AS wing FROM join_requests r
       LEFT JOIN wings w ON w.id = r.wing_id
       ORDER BY (r.status = 'new') DESC, r.created_at DESC LIMIT 100`
    ),
    q<any>(
      `SELECT e.*, s.name_ar AS store, s.slug FROM error_reports e
       JOIN stores s ON s.id = e.store_id
       ORDER BY (e.status = 'new') DESC, e.created_at DESC LIMIT 100`
    ),
  ]);

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>طلبات الانضمام</h2>
        <span>لا يُنشر أي محل قبل المراجعة</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>المسؤول</th><th>الجوال</th><th>الجناح</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.store_name}{r.note && <><br /><span className="hint">{r.note}</span></>}</td>
                <td>{r.contact_name ?? "—"}</td>
                <td className="tabular" dir="ltr">{r.phone}</td>
                <td>{r.wing ?? "—"}</td>
                <td>{REQ_STATUS[r.status] ?? r.status}</td>
                <td>
                  <form action={setRequestStatus} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status}
                      style={{ padding: "4px 8px", fontSize: 13, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--line-2)", borderRadius: 2 }}>
                      {Object.entries(REQ_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn btn-ghost" style={{ padding: "4px 11px", fontSize: 13 }}>حفظ</button>
                  </form>
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={6}>لا توجد طلبات.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="section-head">
        <h2>بلاغات الأخطاء</h2>
        <span>دوام خاطئ = زبون غاضب</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>الحقل</th><th>البلاغ</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/store/${r.slug}`}>{r.store}</Link></td>
                <td>{r.field ?? "—"}</td>
                <td>{r.note}</td>
                <td>{r.status === "new" ? "جديد" : r.status === "fixed" ? "صُحّح" : "مُهمل"}</td>
                <td>
                  <form action={setReportStatus} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="fixed" />
                    <button className="btn btn-ghost" style={{ padding: "4px 11px", fontSize: 13 }}>تم التصحيح</button>
                  </form>
                </td>
              </tr>
            ))}
            {reports.length === 0 && <tr><td colSpan={5}>لا توجد بلاغات.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
