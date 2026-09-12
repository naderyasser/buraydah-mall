import Link from "next/link";
import BrandTile from "@/components/BrandTile";
import ProductRow from "@/components/ProductRow";
import ProductCard from "@/components/ProductCard";
import WingIcon from "@/components/WingIcon";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getBrands, getVisitorStats, getWingIndex } from "@/lib/queries";
import { getBestSellers, getNewArrivals, getOnSale, getTrendingSearches } from "@/lib/browse";
import { q } from "@/db";
import { currentOccasion, upcomingOccasion } from "@/lib/saudi";
import PrayerCard from "@/components/PrayerCard";

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
    getNewArrivals(8),
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
        <Link href={occ.key === "national" ? "/national-day" : "/search?q=الكل&sale=1"} className={`occ-banner occ-${occ.key}`}>
          <span><b>{occ.label}</b><small>{occ.note}</small></span>
          <span className="occ-cta">العروض ←</span>
        </Link>
      )}
      </div>

      <section className="najd">
        <div className="wrap najd-in">
          <div className="najd-top">
            <h1 className="najd-welcome">يا هلا ومرحبا بأهل القصيم، نوّرتم مولكم!</h1>
            <PrayerCard />
          </div>
          <div className="najd-center">
            <p className="najd-kicker">سوق بريدة كامل، في سلة واحدة</p>
            <form className="najd-search" action="/search" role="search">
              <input name="q" placeholder="ابحث عن منتج أو محل…" aria-label="بحث" />
              <button type="submit">بحث</button>
            </form>
            <div className="pills">
              <Link href="/search?q=الكل&sale=1" className="pill">العروض</Link>
              <Link href="/search?q=الكل&sort=newest" className="pill">الجديد</Link>
              <Link href="/stores?open=1" className="pill">مفتوح الآن</Link>
              <details className="hf-dd pill-dd">
                <summary className="pill">الحي ▾</summary>
                <div className="hf-menu">
                  <Link href="/stores">كل الأحياء</Link>
                  {districts.map((d) => (
                    <Link key={d.district} href={`/search?q=الكل&district=${encodeURIComponent(d.district)}`}>
                      حي {d.district} <small className="tabular">({d.n})</small>
                    </Link>
                  ))}
                </div>
              </details>
              <Link href="/search?q=الكل" className="pill">الكل</Link>
            </div>
            <p className="najd-stats tabular">{totals.stores} محلاً · {totals.products} منتجاً · الدفع عند الاستلام{soon ? ` · ${soon.label} بعد ${soon.days} ${soon.days <= 10 ? "أيام" : "يوماً"}` : ""}</p>
          </div>
        </div>
        <div className="najd-parapet" aria-hidden="true" />
      </section>

      <div className="wrap">
      <nav className="circles" aria-label="أقسام المول">
        <Link href="/search?q=%D8%A7%D9%84%D9%83%D9%84" className="circle"><span><WingIcon slug="all" /></span>الكل</Link>
        {wings.map((w: any, i: number) => (
          <Link key={w.slug} href={`/wing/${w.slug}`} className={`circle${i % 2 ? " earth" : ""}`}>
            <span><WingIcon slug={w.slug} /></span>{w.name_ar.replace(/^ال/, "")}
          </Link>
        ))}
        <Link href="/stores" className="circle earth"><span><WingIcon slug="stores" /></span>المحلات</Link>
      </nav>

      <section className="banners">
        {wings.filter((w: any) => w.cover).slice(0, 2).map((w: any, i: number) => (
          <Link href={`/wing/${w.slug}`} className={`banner-x${i === 0 ? " dark" : ""}`} key={w.slug} style={{ backgroundImage: `url(${w.cover})` }}>
            <span className="banner-txt">
              <small>{w.tagline ?? "من محلات بريدة"}</small>
              <b>{w.name_ar}</b>
              <span className="tabular">{w.brand_count} محلاً · تسوّق الآن</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="section" style={{ paddingTop: 6 }}>
        <div className="section-head">
          <h2>آخر ما أضيف في بريدة</h2>
          <Link href="/search?q=الكل&sort=newest">كل الجديد</Link>
        </div>
        <div className="grid">
          {fresh.slice(0, 8).map((p: any) => <ProductCard p={p} key={p.id} />)}
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
