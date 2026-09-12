import Link from "next/link";
import BrandTile from "@/components/BrandTile";
import ProductRow from "@/components/ProductRow";
import ProductCard from "@/components/ProductCard";
import WingIcon from "@/components/WingIcon";
import NationalBanner from "@/components/NationalBanner";
import AdGrid from "@/components/AdGrid";
import { mallMode, getLivePlacements, getSpaceCounts } from "@/lib/ads";
import RecentlyViewed from "@/components/RecentlyViewed";
import { getBrands, getVisitorStats, getWingIndex } from "@/lib/queries";
import { getBestSellers, getNewArrivals, getOnSale, getTrendingSearches } from "@/lib/browse";
import { q } from "@/db";
import { currentOccasion, upcomingOccasion } from "@/lib/saudi";
import PrayerCard from "@/components/PrayerCard";
import Riyal from "@/components/Riyal";
import { isOpenNow } from "@/lib/hours";
import { getSettings } from "@/lib/settings";
import { sar } from "@/lib/money";

export const dynamic = "force-dynamic";

/** أسماء قصيرة للدوائر — سطر واحد تحت كل أيقونة كي لا يزدحم الصفّ */
const SHORT: Record<string, string> = { gold: "ذهب", watches: "ساعات", bags: "شنط", fabrics: "أقمشة", clothing: "ملابس", dresses: "فساتين" };

/** لا يُعرض عدّاد الزوار قبل أن يصير رقماً محترماً — رقم صغير يضرّ أكثر مما ينفع */
const COUNTER_MIN = Number(process.env.PUBLIC_COUNTER_MIN ?? 50);

/**
 * الرئيسية على طريقة حراج: بحث أولاً، ثم صفّ فلاتر من ثلاثة أزرار (الحي/مفتوح
 * الآن/الجديد)، ثم قائمة «آخر ما أضيف» تُقرأ سطراً سطراً — لا لافتة ولا شعارات كبيرة.
 * ما تحتها (العروض، الأكثر مبيعاً، المحلات) يبقى للمتصفّح المتمهّل.
 */
export default async function Home() {
  const [brands, wings, onSale, best, fresh, trending, visitors, districts, [totals], hoursRows, settings] = await Promise.all([
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
    q<{ hours: any }>(`SELECT hours FROM stores WHERE is_active AND hours IS NOT NULL`),
    getSettings(["gold_gram_21", "gold_gram_24"]).catch(() => ({ gold_gram_21: "", gold_gram_24: "" })),
  ]);
  const openNow = hoursRows.filter((r) => isOpenNow(r.hours) === true).length;
  const mode = await mallMode();
  const [placements, counts] = mode === "directory" ? await Promise.all([getLivePlacements("home"), getSpaceCounts("home")]) : [[], []];
  const verified = brands.filter((b: any) => b.is_verified).length;

  const occ = currentOccasion();
  const soon = occ ? null : upcomingOccasion();
  return (
    <>
    <div className="wrap">
      </div>

      <section className="najd">
        <div className="wrap najd-in">
          <div className="najd-grid">
            {/* يمين: الترحيب وثلاث ضمانات */}
            <div className="najd-side najd-side-s">
              <h1 className="najd-welcome">يا هلا ومرحبا بأهل القصيم، نوّرتم مولكم!</h1>
              {mode === "directory" ? (
                <>
                  <p className="najd-lead">كل ماركات ومتاجر بريدة في مول واحد — تختار الماركة، وتضغط، فتنتقل لموقعها الرسمي مباشرة.</p>
                  <ul className="najd-trust">
                    <li><i className="nt-ico">✎</i><span><b>اطلب من أي ماركة بضغطة</b><small>اسمك وجوالك وما تريده — يصل الماركة فوراً وتتواصل معك</small></span></li>
                    <li><i className="nt-ico">↗</i><span><b>وتكمل الشراء معها مباشرة</b><small>على موقعها أو واتسابها — المول يوصلك ولا يقف بينكما</small></span></li>
                    <li><i className="nt-ico">✓</i><span><b>ماركات معتمدة</b><small>كل مساحة باشتراك من الماركة أو وكيلها · <Link href="/advertise">أعلن معنا</Link></small></span></li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="najd-lead">محلات بريدة كلها في سلة واحدة — تطلب من أكثر من محل، وتستلم من المحل أو يوصلك.</p>
                  <ul className="najd-trust">
                    <li><i className="nt-ico">﷼</i><span><b>الدفع عند الاستلام</b><small>لا بطاقة ولا تحويل — تدفع للمحل بيدك</small></span></li>
                    <li><i className="nt-ico">↩</i><span><b>استرجاع خلال ٧ أيام</b><small>وفق نظام التجارة الإلكترونية</small></span></li>
                    <li><i className="nt-ico">✓</i><span><b>محلات بسجل تجاري</b><small>{verified > 0 ? `${verified} محلاً موثّقاً` : "لكل محل صفحة إفصاح"}</small></span></li>
                  </ul>
                </>
              )}
            </div>

            {/* وسط: البحث والفلاتر */}
            <div className="najd-center">
              <p className="najd-kicker">{mode === "directory" ? "ماركات بريدة كلها، في مول واحد" : "سوق بريدة كامل، في سلة واحدة"}</p>
              <form className="najd-search" action="/search" role="search">
                <input name="q" placeholder={mode === "directory" ? "ابحث عن ماركة أو متجر…" : "ابحث عن منتج أو محل…"} aria-label="بحث" />
                <button type="submit">بحث</button>
              </form>
              <div className="pills">
                {mode === "directory" ? (
                  <>
                    <Link href="/requests" className="pill pill-gold">اطلب الآن</Link>
                    <Link href="/stores" className="pill">كل الماركات</Link>
                    <Link href="/stores?open=1" className="pill">مفتوح الآن</Link>
                    <Link href="/advertise" className="pill">أعلن معنا</Link>
                  </>
                ) : (
                  <>
                    <Link href="/search?q=الكل&sale=1" className="pill">العروض</Link>
                    <Link href="/search?q=الكل&sort=newest" className="pill">الجديد</Link>
                    <Link href="/stores?open=1" className="pill">مفتوح الآن</Link>
                  </>
                )}
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
                {mode !== "directory" && <Link href="/search?q=الكل" className="pill">الكل</Link>}
              </div>
              <p className="najd-stats tabular">{mode === "directory" ? `${totals.stores} ماركة ومتجراً · ${wings.length} قطاعاً · ${districts.length} أحياء` : `${totals.stores} محلاً · ${totals.products} منتجاً · ${districts.length} أحياء`}{soon ? ` · ${soon.label} بعد ${soon.days} ${soon.days <= 10 ? "أيام" : "يوماً"}` : ""}</p>
            </div>

            {/* يسار: مواقيت اليوم وحال المول الآن */}
            <div className="najd-side najd-side-e">
              <PrayerCard />
              <div className="najd-today">
                <div className="nt-row"><span className="nt-dot" /><b className="tabular">{openNow}</b> محلاً مفتوحاً الآن <Link href="/stores?open=1">اعرضها</Link></div>
                {mode !== "directory" && settings.gold_gram_21 && Number(settings.gold_gram_21) > 0 && (
                  <div className="nt-row"><span className="nt-gold">ذ</span> جرام الذهب عيار ٢١ اليوم <b className="tabular">{sar(settings.gold_gram_21)}</b> <Riyal /> <Link href="/wing/gold">الأسعار</Link></div>
                )}
                {mode === "directory"
                  ? <div className="nt-row"><span className="nt-pin">●</span> ما لقيت ما تبحث عنه؟ <Link href="/requests">اطلبه والماركات تعرض عليك</Link></div>
                  : <div className="nt-row"><span className="nt-pin">●</span> التوصيل داخل بريدة · <Link href="/requests">اطلب ما لا تجده</Link></div>}
              </div>
            </div>
          </div>
        </div>
        <span className="najd-edge najd-edge-s" aria-hidden="true" />
        <span className="najd-edge najd-edge-e" aria-hidden="true" />
        <div className="najd-parapet" aria-hidden="true" />
      </section>

      <div className="wrap">
      <nav className="circles" aria-label="أقسام المول">
        <Link href="/search?q=%D8%A7%D9%84%D9%83%D9%84" className="circle"><span><WingIcon slug="all" /></span>الكل</Link>
        {wings.map((w: any, i: number) => (
          <Link key={w.slug} href={`/wing/${w.slug}`} className={`circle${i % 2 ? " earth" : ""}`}>
            <span><WingIcon slug={w.slug} /></span>{SHORT[w.slug] ?? w.name_ar.replace(/^ال/, "")}
          </Link>
        ))}
        <Link href="/stores" className="circle earth"><span><WingIcon slug="stores" /></span>المحلات</Link>
      </nav>

      <NationalBanner />

      {mode === "directory" ? (
        <>
          <AdGrid placements={placements} counts={counts} zoneLabel="الرئيسية" />

          <section className="section">
            <div className="section-head">
              <h2>قطاعات المول</h2>
              <Link href="/stores">دليل الماركات كاملاً</Link>
            </div>
            <div className="sector-wall">
              {wings.map((w: any) => (
                <Link href={`/wing/${w.slug}`} key={w.id} className="sector-tile">
                  <span className="sector-ico"><WingIcon slug={w.slug} /></span>
                  <b>{w.name_ar}</b>
                  <small className="tabular">{w.brand_count} {w.brand_count === 1 ? "ماركة" : "ماركات"}</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>الماركات والمتاجر</h2>
              <Link href="/stores">حسب الحي والقطاع</Link>
            </div>
            <div className="brand-wall">
              {brands.slice(0, 18).map((b: any) => <BrandTile b={b} key={b.id} directory />)}
            </div>
            {brands.length > 18 && (
              <p style={{ textAlign: "center", marginTop: 14 }}>
                <Link href="/stores" className="btn btn-line">كل الماركات ({brands.length})</Link>
              </p>
            )}
          </section>
        </>
      ) : (
        <>

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

        </>
      )}

      {mode !== "directory" && <RecentlyViewed />}


    </div>
    </>
  );
}
