import Link from "next/link";
import BrandTile from "@/components/BrandTile";
import ProductRow from "@/components/ProductRow";
import FeedRow from "@/components/FeedRow";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getBrands, getVisitorStats, getWingIndex } from "@/lib/queries";
import { getBestSellers, getNewArrivals, getOnSale, getTrendingSearches } from "@/lib/browse";
import { q } from "@/db";
import { currentOccasion, upcomingOccasion } from "@/lib/saudi";
import PrayerCard from "@/components/PrayerCard";
import WingCarousel from "@/components/WingCarousel";

export const dynamic = "force-dynamic";

/** لا يُعرض عدّاد الزوار قبل أن يصير رقماً محترماً — رقم صغير يضرّ أكثر مما ينفع */
const COUNTER_MIN = Number(process.env.PUBLIC_COUNTER_MIN ?? 50);

/**
 * الرئيسية على طريقة حراج: بحث أولاً، ثم صفّ فلاتر من ثلاثة أزرار (الحي/مفتوح
 * الآن/الجديد)، ثم قائمة «آخر ما أضيف» تُقرأ سطراً سطراً — لا لافتة ولا شعارات كبيرة.
 * ما تحتها (العروض، الأكثر مبيعاً، المحلات) يبقى للمتصفّح المتمهّل.
 */
export default async function Home() {
  const [brands, wings, onSale, best, fresh, trending, visitors, districts, [totals]] = await Promise.all([
    getBrands(),
    getWingIndex(),
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

  const occ = currentOccasion();
  const soon = occ ? null : upcomingOccasion();
  return (
    <>
    <div className="wrap">
      {occ && (
        <Link href="/search?q=الكل&sale=1" className={`occ-banner occ-${occ.key}`}>
          <span><b>{occ.label}</b><small>{occ.note}</small></span>
          <span className="occ-cta">العروض ←</span>
        </Link>
      )}
      <section className="welcome">
        <div>
          <h1>يا هلا ومرحبا بأهل بريدة، نوّرتم مولكم</h1>
          <p>محلات المدينة كلها في مكان واحد — تختار من أكثر من محل في سلة واحدة، وتستلم من المحل أو يوصلك.</p>
          {soon && <Link href="/search?q=الكل&sale=1" className="soon">{soon.label} بعد <b className="tabular">{soon.days}</b> {soon.days <= 10 ? "أيام" : "يوماً"} — عروض المحلات</Link>}
        </div>
        <PrayerCard />
      </section>
      </div>

      <section className="najd">
        <div className="wrap najd-in">
          <p className="najd-kicker">سوق بريدة كامل، في سلة واحدة</p>
          <form className="najd-search" action="/search" role="search">
            <input name="q" placeholder="ابحث عن منتج أو محل…" aria-label="بحث" />
            <button type="submit">بحث</button>
          </form>
          <p className="najd-stats tabular">{totals.stores} محلاً · {totals.products} منتجاً · الدفع عند الاستلام{visitors.total >= COUNTER_MIN && ` · زارنا ${visitors.total.toLocaleString("en-US")}`}</p>
          <div className="hfilters">
            <details className="hf-dd">
              <summary>الحي ▾</summary>
              <div className="hf-menu">
                <Link href="/stores">كل الأحياء</Link>
                {districts.map((d) => (
                  <Link key={d.district} href={`/search?q=الكل&district=${encodeURIComponent(d.district)}`}>
                    حي {d.district} <small className="tabular">({d.n})</small>
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/stores?open=1" className="hf-btn">مفتوح الآن</Link>
            <Link href="/search?q=الكل&sort=newest" className="hf-btn">الجديد</Link>
            <Link href="/search?q=الكل&sale=1" className="hf-btn">العروض</Link>
          </div>
          {trending.length > 0 && (
            <div className="trending">
              <span>الأكثر بحثاً:</span>
              {trending.map((t) => (
                <Link key={t.term} href={`/search?q=${encodeURIComponent(t.term)}`}>{t.term}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="wrap">
      <WingCarousel wings={wings} />

      <section className="section" style={{ paddingTop: 6 }}>
        <div className="section-head">
          <h2>آخر ما أضيف في بريدة</h2>
          <Link href="/search?q=الكل&sort=newest">كل الجديد</Link>
        </div>
        <div className="feed">
          {fresh.map((p: any) => <FeedRow p={p} key={p.id} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>تسوّق حسب الحي</h2>
          <Link href="/stores">كل الأحياء</Link>
        </div>
        <div className="district-wall">
          {districts.map((d) => (
            <Link key={d.district} href={`/search?q=الكل&district=${encodeURIComponent(d.district)}`} className="district-tile">
              <span className="dt-name">حي {d.district}</span>
              <span className="dt-n tabular">{d.n} {d.n === 1 ? "محل" : d.n <= 10 ? "محلات" : "محلاً"}</span>
            </Link>
          ))}
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


    </div>
    </>
  );
}
