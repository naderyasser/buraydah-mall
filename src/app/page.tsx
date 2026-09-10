import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import BrandTile from "@/components/BrandTile";
import { getWingIndex, getBrands, getFeaturedProducts, getVisitorStats } from "@/lib/queries";
import { q } from "@/db";

export const revalidate = 300;

/** لا يُعرض عدّاد الزوار قبل أن يصير رقماً محترماً — رقم صغير يضرّ أكثر مما ينفع */
const COUNTER_MIN = Number(process.env.PUBLIC_COUNTER_MIN ?? 50);

export default async function Home() {
  const [wings, brands, featured, visitors, [totals]] = await Promise.all([
    getWingIndex(),
    getBrands(),
    getFeaturedProducts(10),
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
              {totals.stores} ماركة ومحلاً داخل المدينة. اطلب من أكثر من محل في طلب
              واحد، واستلم من المحل أو اطلب التوصيل.
            </p>
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


      <div className="wrap">
        <section className="section">
          <div className="section-head">
            <h2>أقسام المول</h2>
            <span className="tabular">{totals.stores} ماركة · {totals.products} منتجاً</span>
          </div>
          <div className="wing-grid">
            {wings.map((w) => (
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

        <section className="section">
          <div className="section-head">
            <h2>الماركات</h2>
            <span>الماركة الموسومة بسهم تنقلك لمتجرها مباشرة</span>
          </div>
          <div className="brand-wall">
            {brands.map((b) => <BrandTile b={b} key={b.id} />)}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>مختارات من المول</h2>
            <Link href="/search?q=%D8%A7%D9%84%D9%83%D9%84">تصفّح كل المنتجات</Link>
          </div>
          <div className="grid">
            {featured.map((p) => <ProductCard p={p} key={p.id} />)}
          </div>
        </section>

        <section className="section">
          <div className="section-head"><h2>كيف يشتغل المول</h2></div>
          <div className="panels">
            <div className="panel">
              <h4>ماركات تدخل متجرها</h4>
              <p style={{ margin: 0, color: "var(--text-2)" }}>
                الماركات الكبرى ولها موقعها أو متجرها الخاص: تضغط الشعار فينقلك
                المول إلى متجرها مباشرة. الوجود في الدليل مجاني.
              </p>
            </div>
            <div className="panel">
              <h4>محلات تشتري منها هنا</h4>
              <p style={{ margin: 0, color: "var(--text-2)" }}>
                محلات المدينة التي لا متجر إلكتروني لها: تعرض منتجاتها داخل المول،
                وتضيفها لسلة واحدة ولو من أكثر من محل.
              </p>
            </div>
            <div className="panel">
              <h4>طلب واحد يُوزَّع</h4>
              <p style={{ margin: 0, color: "var(--text-2)" }}>
                اسم ورقم جوال فقط، ولا دفع إلكتروني. كل محل يستلم نصيبه من الطلب
                ويؤكّده، ويصلك تأكيد واحد منّا.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
