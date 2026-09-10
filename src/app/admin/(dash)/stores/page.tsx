import Link from "next/link";
import { q } from "@/db";
import { toggleStore } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "المحلات" };

export default async function StoresAdmin() {
  const rows = await q<{
    id: number; name_ar: string; slug: string; wing: string; tier: string;
    is_active: boolean; dest_type: string; clicks: number;
  }>(
    `SELECT s.id, s.name_ar, s.slug, w.name_ar AS wing, s.tier, s.is_active, s.dest_type,
            (SELECT count(*) FROM clicks c WHERE c.store_id = s.id
              AND c.created_at > now() - interval '30 days')::int AS clicks
     FROM stores s JOIN wings w ON w.id = s.wing_id
     ORDER BY s.is_active DESC, w.sort_order, s.sort_order, s.name_ar`
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>المحلات ({rows.length})</h2>
        <Link className="btn btn-brand" style={{ padding: "9px 18px", fontSize: 14.5 }} href="/admin/stores/new">
          + محل جديد
        </Link>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead>
            <tr><th>المحل</th><th>الجناح</th><th>الوجهة</th><th>الفئة</th><th>نقرات 30 يوماً</th><th>الحالة</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.55 }}>
                <td>{r.name_ar}</td>
                <td>{r.wing}</td>
                <td>{r.dest_type}</td>
                <td>{r.tier === "featured" ? "مميّز" : r.tier === "paid" ? "مدفوع" : "مجاني"}</td>
                <td className="tabular">{r.clicks}</td>
                <td>
                  <form action={toggleStore}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost" style={{ padding: "4px 11px", fontSize: 13 }}>
                      {r.is_active ? "منشور" : "مخفي"}
                    </button>
                  </form>
                </td>
                <td><Link href={`/admin/stores/${r.id}`}>تعديل</Link></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}>لا توجد محلات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
