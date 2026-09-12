import Link from "next/link";
import BrandTile from "@/components/BrandTile";
import ProductRow from "@/components/ProductRow";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getWingIndex, getBrands, getVisitorStats } from "@/lib/queries";
import { getBestSellers, getNewArrivals, getOnSale, getMostViewed, getTrendingSearches } from "@/lib/browse";
import { q } from "@/db";

export const dynamic = "force-dynamic";

/** لا يُعرض عدّاد الزوار قبل أن يصير رقماً محترماً — رقم صغير يضرّ أكثر مما ينفع */
const COUNTER_MIN = Number(process.env.PUBLIC_COUNTER_MIN ?? 50);

export default async function Home() {
  const [wings, brands, onSale, best, fresh, viewed, trending, visitors, [totals]] = await Promise.all([
    getWingIndex(),
    getBrands(),
    getOnSale(10),
    getBestSellers(10),
    getNewArrivals(10),
    getMostViewed(10),
    getTrendingSearches(8),
    getVisitorStats(),
    q<{ products: number; stores: number }>(
      `SELECT (SELECT count(*) FROM products WHERE is_active)::int AS products,
              (SELECT count(*) FROM stores   WHERE is_active)::int AS stores`
    ),
  ]);

  return (
    <>
      <div className="wrap">
        <section className="banner">
          <div>
            <h1>سوق بريدة كامل، في سلة واحدة</h1>
            <p>
              {totals.stores} ماركة ومحلاً داخل المدينة، و{totals.products} منتجاً بأسعارها.
              اطلب من أكثر من محل في طلب واحد، واستلم من المحل أو اطلب التوصيل.
            </p>
            {trending.length > 0 && (
              <div className="trending">
                <span>الأكثر بحثاً:</span>
                {trending.slice(0, 5).map((t) => (
                  <Link key={t.term} href={`/search?q=${encodeURIComponent(t.term)}`}>{t.term}</Link>
                ))}
              </div>
            )}
          </div>
          <div className="side">
            <Link href="/search?q=%D8%A7%D9%84%D9%83%D9%84" className="cta">تسوّق الآن</Link>
            {visitors.total >= COUNTER_MIN && (
              <span className="visitors">
                <span className="dot" />
                زارنا <b className="tabular">{visitors.total.toLocaleString("en-US")}</b> زائر
                {visitors.today > 0 && <> · اليوم <b className="tabular">{visitors.today}</b></>}
              </span>
            )}
          </div>
        </section>
      </div>

      <div className="trust-strip">
        <div className="wrap">
          <span>الدفع عند الاستلام — بدون رسوم</span>
          <span>استرجاع خلال ٧ أيام</span>
          <span>الأسعار شاملة ضريبة القيمة المضافة</span>
          <span>محلات لها فرع فعلي في بريدة</span>
        </div>
      </div>

      <div className="wrap">
        <section className="section">
          <div className="section-head">
            <h2>أقسام المول</h2>
            <span className="tabular">{totals.stores} ماركة · {totals.products} منتجاً</span>
          </div>
          <div className="wing-grid">
            {wings.map((w: any) => (
              <Link href={`/wing/${w.slug}`} key={w.id} className="wing-tile">
                {w.cover && <img src={w.cover} alt="" loading="lazy" />}
                <span className="veil" />
                <span className="txt">
                  <h3>{w.name_ar}</h3>
                  {w.tagline && <small>{w.tagline}</small>}
                  <span className="n">
                    <span className="tabular">{w.brand_count} ماركة</span>
                    {w.selling_count > 0 && <span className="tabular">{w.selling_count} تبيع أونلاين</span>}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <ProductRow title="عروض المول" items={onSale}
          more={{ href: "/search?q=الكل&sale=1", label: "كل العروض" }} />

        <ProductRow title="الأكثر مبيعاً" items={best} note="من طلبات حقيقية داخل المول" />

        <ProductRow title="وصل حديثاً" items={fresh}
          more={{ href: "/search?q=الكل&sort=newest", label: "كل الجديد" }} />

        <section className="section">
          <div className="section-head">
            <h2>الماركات</h2>
            <Link href="/stores">دليل المحلات حسب الحي</Link>
          </div>
          <div className="brand-wall">
            {brands.map((b: any) => <BrandTile b={b} key={b.id} />)}
          </div>
        </section>

        <ProductRow title="الأكثر مشاهدة" items={viewed}
          more={{ href: "/search?q=الكل&sort=popular", label: "تصفّح الكل" }} />

        <RecentlyViewed />

        <section className="section">
          <div className="section-head"><h2>كيف يشتغل المول</h2></div>
          <div className="panels">
            <div className="panel">
              <h4>ماركات تدخل متجرها</h4>
              <p style={{ margin: 0, color: "var(--mut)" }}>
                الماركات الكبرى ولها موقعها أو متجرها الخاص: تضغط الشعار فينقلك
                المول إلى متجرها مباشرة. الوجود في الدليل مجاني.
              </p>
            </div>
            <div className="panel">
              <h4>محلات تشتري منها هنا</h4>
              <p style={{ margin: 0, color: "var(--mut)" }}>
                محلات المدينة التي لا متجر إلكتروني لها: تعرض منتجاتها داخل المول،
                وتضيفها لسلة واحدة ولو من أكثر من محل.
              </p>
            </div>
            <div className="panel">
              <h4>طلب واحد يُوزَّع</h4>
              <p style={{ margin: 0, color: "var(--mut)" }}>
                اسم ورقم جوال فقط، ولا دفع إلكتروني. كل محل يستلم نصيبه من الطلب
                ويؤكّده، ويصلك رمز استلام واحد.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
