import Link from "next/link";
import BrandTile from "@/components/BrandTile";
import ProductRow from "@/components/ProductRow";
import FeedRow from "@/components/FeedRow";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getBrands, getVisitorStats } from "@/lib/queries";
import { getBestSellers, getNewArrivals, getOnSale, getTrendingSearches } from "@/lib/browse";
import { q } from "@/db";

export const dynamic = "force-dynamic";

/** لا يُعرض عدّاد الزوار قبل أن يصير رقماً محترماً — رقم صغير يضرّ أكثر مما ينفع */
const COUNTER_MIN = Number(process.env.PUBLIC_COUNTER_MIN ?? 50);

/**
 * الرئيسية على طريقة حراج: بحث أولاً، ثم صفّ فلاتر من ثلاثة أزرار (الحي/مفتوح
 * الآن/الجديد)، ثم قائمة «آخر ما أضيف» تُقرأ سطراً سطراً — لا لافتة ولا شعارات كبيرة.
 * ما تحتها (العروض، الأكثر مبيعاً، المحلات) يبقى للمتصفّح المتمهّل.
 */
export default async function Home() {
  const [brands, onSale, best, fresh, trending, visitors, districts, [totals]] = await Promise.all([
    getBrands(),
    getOnSale(10),
    getBestSellers(10),
    getNewArrivals(14),
    getTrendingSearches(6),
    getVisitorStats(),
    q<{ district: string; n: number }>(
      `SELECT district, count(*)::int AS n FROM stores WHERE is_active AND district IS NOT NULL
       GROUP BY district ORDER BY n DESC, district LIMIT 8`
    ),
    q<{ products: number; stores: number }>(
      `SELECT (SELECT count(*) FROM products WHERE is_active)::int AS products,
              (SELECT count(*) FROM stores   WHERE is_active)::int AS stores`
    ),
  ]);

  return (
    <div className="wrap">
      <section className="hsec">
        <h1>سوق بريدة كامل، في سلة واحدة</h1>
        <p className="hsub">
          <span className="tabular">{totals.stores}</span> محلاً و<span className="tabular">{totals.products}</span> منتجاً
          من داخل المدينة · الدفع عند الاستلام
          {visitors.total >= COUNTER_MIN && <> · زارنا <b className="tabular">{visitors.total.toLocaleString("en-US")}</b></>}
        </p>

        <div className="hfilters">
          <details className="hf-dd">
            <summary>📍 الحي</summary>
            <div className="hf-menu">
              <Link href="/stores">كل الأحياء</Link>
              {districts.map((d) => (
                <Link key={d.district} href={`/search?q=الكل&district=${encodeURIComponent(d.district)}`}>
                  حي {d.district} <small className="tabular">({d.n})</small>
                </Link>
              ))}
            </div>
          </details>
          <Link href="/stores?open=1" className="hf-btn">🕐 مفتوح الآن</Link>
          <Link href="/search?q=الكل&sort=newest" className="hf-btn">✨ الجديد</Link>
          <Link href="/search?q=الكل&sale=1" className="hf-btn">🏷 العروض</Link>
        </div>

        {trending.length > 0 && (
          <div className="trending">
            <span>الأكثر بحثاً:</span>
            {trending.map((t) => (
              <Link key={t.term} href={`/search?q=${encodeURIComponent(t.term)}`}>{t.term}</Link>
            ))}
          </div>
        )}
      </section>

      <section className="section" style={{ paddingTop: 6 }}>
        <div className="section-head">
          <h2>آخر ما أضيف في بريدة</h2>
          <Link href="/search?q=الكل&sort=newest">كل الجديد</Link>
        </div>
        <div className="feed">
          {fresh.map((p: any) => <FeedRow p={p} key={p.id} />)}
        </div>
      </section>

      <ProductRow title="عروض المول" items={onSale}
        more={{ href: "/search?q=الكل&sale=1", label: "كل العروض" }} />

      <ProductRow title="الأكثر مبيعاً" items={best} note="من طلبات حقيقية داخل المول" />

      <section className="section">
        <div className="section-head">
          <h2>المحلات</h2>
          <Link href="/stores">دليل المحلات حسب الحي</Link>
        </div>
        <div className="brand-wall">
          {brands.slice(0, 12).map((b: any) => <BrandTile b={b} key={b.id} />)}
        </div>
        {brands.length > 12 && (
          <p style={{ textAlign: "center", marginTop: 14 }}>
            <Link href="/stores" className="btn btn-line">عرض كل المحلات ({brands.length})</Link>
          </p>
        )}
      </section>

      <RecentlyViewed />

      <section className="section how">
        <div className="section-head"><h2>كيف تشتري من المول؟</h2></div>
        <ol className="steps">
          <li><b>اختر</b> من أي محل — أو من أكثر من محل في سلة واحدة.</li>
          <li><b>اطلب</b> باسمك وجوالك فقط. لا دفع إلكتروني ولا تسجيل.</li>
          <li><b>استلم</b> من المحل برمز الاستلام، أو اطلب التوصيل داخل بريدة.</li>
        </ol>
      </section>
    </div>
  );
}
