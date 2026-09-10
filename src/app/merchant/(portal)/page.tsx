import Link from "next/link";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { currentStore } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التاجر", robots: { index: false } };

export default async function MerchantHome() {
  const store = (await currentStore())!;
  const [[t], top, alerts] = await Promise.all([
    q<any>(
      `SELECT
        (SELECT count(DISTINCT oi.order_id) FROM order_items oi
           WHERE oi.store_id = $1 AND oi.status = 'new')::int                       AS orders_new,
        (SELECT count(DISTINCT oi.order_id) FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE oi.store_id = $1 AND o.created_at > now() - interval '30 days')::int AS orders_30,
        (SELECT coalesce(sum(oi.price*oi.qty),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE oi.store_id = $1 AND oi.status <> 'cancelled'
             AND o.created_at > now() - interval '30 days')                          AS value_30,
        (SELECT count(*) FROM products WHERE store_id = $1 AND is_active)::int       AS products,
        (SELECT count(*) FROM products WHERE store_id = $1 AND is_active AND NOT in_stock)::int AS out_stock,
        (SELECT coalesce(sum(views),0) FROM products WHERE store_id = $1)::int       AS views,
        (SELECT count(*) FROM clicks WHERE store_id = $1
           AND created_at > now() - interval '30 days')::int                         AS clicks,
        (SELECT round(avg(rating),1) FROM reviews WHERE store_id = $1 AND status='published') AS rating,
        (SELECT count(*) FROM questions WHERE store_id = $1 AND answer IS NULL)::int AS q_open,
        (SELECT count(*) FROM buy_requests r WHERE r.status = 'open' AND r.expires_on >= current_date
           AND (r.wing_id IS NULL OR r.wing_id = (SELECT wing_id FROM stores WHERE id = $1))
           AND NOT EXISTS (SELECT 1 FROM buy_offers o WHERE o.request_id = r.id AND o.store_id = $1)
        )::int AS open_requests,
        (SELECT max(data_updated_at) FROM stores WHERE id = $1)                      AS data_updated`,
      [store.id]
    ),
    q<any>(
      `SELECT p.name_ar, p.slug, p.views,
              coalesce(sum(oi.qty) FILTER (WHERE oi.status <> 'cancelled'), 0)::int AS sold
       FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id
       WHERE p.store_id = $1 AND p.is_active
       GROUP BY p.id ORDER BY sold DESC, p.views DESC LIMIT 8`,
      [store.id]
    ),
    q<any>(
      `SELECT p.name_ar, p.slug, count(*)::int AS waiting
       FROM stock_alerts a JOIN products p ON p.id = a.product_id
       WHERE p.store_id = $1 AND NOT a.notified
       GROUP BY p.id, p.name_ar, p.slug ORDER BY waiting DESC LIMIT 6`,
      [store.id]
    ),
  ]);

  return (
    <div className="wrap">
      <section className="section" style={{ paddingBottom: 0 }}>
        <h1 style={{ fontSize: 26 }}>أهلاً {store.name_ar}</h1>
        <p style={{ color: "var(--mut)", marginTop: 6 }}>
          الأرقام لآخر ٣٠ يوماً ما لم يُذكر غير ذلك.
          {t.orders_new > 0 && <> عندك <b>{t.orders_new}</b> طلباً ينتظر تأكيدك.</>}
        </p>
      </section>

      <dl className="stat-row">
        <div className="stat"><dt>طلبات تنتظرك</dt>
          <dd style={{ color: t.orders_new > 0 ? "var(--price)" : undefined }}>{t.orders_new}</dd></div>
        <div className="stat"><dt>طلبات (٣٠ يوماً)</dt><dd>{t.orders_30}</dd></div>
        <div className="stat"><dt>قيمة المبيعات</dt><dd>{sar(t.value_30)}<small> ر.س</small></dd></div>
        <div className="stat"><dt>منتجاتك</dt><dd>{t.products}<small> منها {t.out_stock} نافد</small></dd></div>
        <div className="stat"><dt>مشاهدات منتجاتك</dt><dd>{t.views}</dd></div>
        <div className="stat"><dt>تقييمك</dt><dd>{t.rating ?? "—"}<small> من ٥</small></dd></div>
      </dl>

      {t.open_requests > 0 && (
        <p className="ok-note">
          {t.open_requests} طلب شراء مفتوح في قسمك بلا عرض منك —{" "}
          <Link href="/merchant/requests">اعرض عليها</Link>؛ الزبون هنا يبحث عن بضاعتك بنفسه.
        </p>
      )}

      {t.data_updated && Date.now() - new Date(t.data_updated).getTime() > 14 * 864e5 && (
        <p className="ok-note" style={{ background: "var(--gold-soft)", color: "#8A5A12" }}>
          لم تُحدَّث بيانات محلك منذ أكثر من أسبوعين — الكتالوج القديم أكثر ما يقتل
          الثقة. <Link href="/merchant/settings">راجع بياناتك</Link>.
        </p>
      )}

      {t.q_open > 0 && (
        <p className="ok-note">
          عندك {t.q_open} سؤالاً بلا جواب — <Link href="/merchant/questions">أجب عليها</Link>؛
          المحل الذي يردّ يبيع أكثر.
        </p>
      )}

      {alerts.length > 0 && (
        <>
          <div className="section-head" style={{ marginTop: 34 }}>
            <h2>ينتظرون توفّر هذه المنتجات</h2><span>زبائن سجّلوا أرقامهم</span>
          </div>
          <div className="tablewrap">
            <table className="admin">
              <thead><tr><th>المنتج</th><th>عدد المنتظرين</th></tr></thead>
              <tbody>
                {alerts.map((a: any) => (
                  <tr key={a.slug}>
                    <td><Link href={`/product/${a.slug}`}>{a.name_ar}</Link></td>
                    <td className="tabular">{a.waiting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>أفضل منتجاتك</h2><span>مبيعاً ومشاهدة</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المنتج</th><th>مبيع</th><th>مشاهدات</th></tr></thead>
          <tbody>
            {top.map((r: any) => (
              <tr key={r.slug}>
                <td><Link href={`/product/${r.slug}`}>{r.name_ar}</Link></td>
                <td className="tabular">{r.sold}</td>
                <td className="tabular">{r.views}</td>
              </tr>
            ))}
            {top.length === 0 && <tr><td colSpan={3}>لا منتجات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
