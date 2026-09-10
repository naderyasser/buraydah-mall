import Link from "next/link";
import { q } from "@/db";
import { sar } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكّم" };

export default async function Dashboard() {
  const [[t], topStores, recent] = await Promise.all([
    q<any>(
      `SELECT
        (SELECT count(*) FROM visits)::int                                                AS visits_all,
        (SELECT count(*) FROM visits WHERE created_at > now() - interval '30 days')::int  AS visits_30,
        (SELECT count(*) FROM orders WHERE status <> 'cancelled')::int                    AS orders_all,
        (SELECT count(*) FROM orders WHERE status <> 'cancelled'
           AND created_at > now() - interval '30 days')::int                              AS orders_30,
        (SELECT coalesce(sum(total),0) FROM orders WHERE status <> 'cancelled'
           AND created_at > now() - interval '30 days')                                   AS value_30,
        (SELECT count(*) FROM clicks WHERE created_at > now() - interval '30 days')::int  AS clicks_30,
        (SELECT count(*) FROM orders WHERE status = 'new')::int                           AS orders_new`
    ),
    q<any>(
      // النافذة الزمنية داخل LATERAL لا داخل شرط LEFT JOIN: الشرط هناك
      // يترك سطور الطلبات القديمة قائمة فيصير «٣٠ يوماً» عمرَ المول كله.
      `SELECT s.id, s.name_ar, s.slug,
              coalesce(a.orders, 0)::int AS orders,
              coalesce(a.value, 0)       AS value,
              (SELECT count(*) FROM clicks c WHERE c.store_id = s.id
                 AND c.created_at > now() - interval '30 days')::int AS clicks
       FROM stores s
       LEFT JOIN LATERAL (
         SELECT count(DISTINCT oi.order_id) AS orders, sum(oi.price * oi.qty) AS value
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE oi.store_id = s.id AND oi.status <> 'cancelled'
           AND o.created_at > now() - interval '30 days'
       ) a ON true
       WHERE s.is_active
       GROUP BY s.id, a.orders, a.value ORDER BY orders DESC, value DESC, clicks DESC LIMIT 12`
    ),
    q<any>(`SELECT code, token, customer_name, total, items_count, stores_count, status, created_at
            FROM orders ORDER BY created_at DESC LIMIT 8`),
  ]);

  return (
    <div className="wrap">
      <section className="section" style={{ paddingBottom: 0 }}>
        <h1 style={{ fontSize: 28 }}>لوحة التحكّم</h1>
        <p style={{ color: "var(--text-2)", marginTop: 6 }}>
          الأرقام لآخر 30 يوماً ما لم يُذكر غير ذلك. عدّاد الزوار وحده معروض للعموم — القيمة والطلبات خاصة بالإدارة.
        </p>
      </section>

      <dl className="stat-row">
        <div className="stat"><dt>الزوار (الكل)</dt><dd>{t.visits_all}</dd></div>
        <div className="stat"><dt>الزوار (30 يوماً)</dt><dd>{t.visits_30}</dd></div>
        <div className="stat"><dt>الطلبات (30 يوماً)</dt><dd>{t.orders_30}<small> من {t.orders_all} إجمالاً</small></dd></div>
        <div className="stat"><dt>قيمة الطلبات (30 يوماً)</dt><dd>{sar(t.value_30)}<small> ر.س</small></dd></div>
        <div className="stat"><dt>نقرات التواصل</dt><dd>{t.clicks_30}</dd></div>
        <div className="stat"><dt>طلبات لم تُؤكَّد</dt><dd style={{ color: t.orders_new > 0 ? "var(--date)" : undefined }}>{t.orders_new}</dd></div>
      </dl>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>أداء كل ماركة</h2><span>طلبات وقيمة ونقرات — 30 يوماً</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>الطلبات</th><th>قيمة المبيعات</th><th>نقرات التواصل</th><th></th></tr></thead>
          <tbody>
            {topStores.map((r: any) => (
              <tr key={r.id}>
                <td>{r.name_ar}</td>
                <td className="tabular">{r.orders}</td>
                <td className="tabular">{sar(r.value)} ر.س</td>
                <td className="tabular">{r.clicks}</td>
                <td><Link href={`/store/${r.slug}`}>الصفحة</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>آخر الطلبات</h2><Link href="/admin/orders">كل الطلبات</Link>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>الرقم</th><th>العميل</th><th>القطع</th><th>المحلات</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
          <tbody>
            {recent.map((o: any) => (
              <tr key={o.code}>
                <td><Link href={`/order/${o.token}`} className="tabular">{o.code}</Link></td>
                <td>{o.customer_name}</td>
                <td className="tabular">{o.items_count}</td>
                <td className="tabular">{o.stores_count}</td>
                <td className="tabular">{sar(o.total)} ر.س</td>
                <td>{o.status === "new" ? "جديد" : o.status === "confirmed" ? "مؤكَّد" : o.status === "done" ? "مكتمل" : "ملغى"}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={6}>لا توجد طلبات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
