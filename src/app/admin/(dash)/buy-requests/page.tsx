import { q } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { sar } from "@/lib/money";
import { agoAr } from "@/lib/time";
import { setBuyRequestStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلبات الشراء" };

const ST: Record<string, string> = { open: "مفتوح", closed: "مغلق", rejected: "مرفوض" };

export default async function BuyRequestsAdmin() {
  await requireAdmin();
  const rows = await q<any>(
    `SELECT r.*, w.name_ar AS wing,
            (SELECT count(*)::int FROM buy_offers o WHERE o.request_id = r.id) AS offers
     FROM buy_requests r LEFT JOIN wings w ON w.id = r.wing_id
     ORDER BY (r.status = 'open') DESC, r.created_at DESC LIMIT 100`
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>طلبات الشراء ({rows.length})</h2>
        <span>ما يطلبه أهل بريدة ولا نملكه — أصدق دليل على ما ينقص المول</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead>
            <tr><th>الطلب</th><th>القسم</th><th>الميزانية</th><th>الزبون</th><th>عروض</th><th>الحالة</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td style={{ maxWidth: 280 }}>
                  {r.title}
                  {r.body && <><br /><span className="hint">{r.body}</span></>}
                  <br /><span className="hint">{agoAr(r.created_at)}</span>
                </td>
                <td>{r.wing ?? "—"}</td>
                <td className="tabular">{r.budget_max ? `${sar(r.budget_max)} ر.س` : "—"}</td>
                <td>{r.customer_name}<br /><span className="hint tabular" dir="ltr">{r.phone}</span></td>
                <td className="tabular">{r.offers}</td>
                <td>{ST[r.status]}</td>
                <td>
                  <form action={setBuyRequestStatus} style={{ display: "flex", gap: 6 }}>
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
            {rows.length === 0 && <tr><td colSpan={7}>لا طلبات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
