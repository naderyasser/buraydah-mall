import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import Countdown from "@/components/Countdown";
import { q } from "@/db";
import { getSimilarProducts } from "@/lib/queries";
import { currentOccasion, upcomingOccasion, occasionEnd, occasionStart, OCCASION_COUPON, OCCASION_TAG } from "@/lib/saudi";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "عروض اليوم الوطني ٩٦ في بريدة — مول بريدة",
  description: "عروض محلات بريدة بمناسبة اليوم الوطني السعودي ٩٦: خصومات من المحلات وكود موحّد، الدفع عند الاستلام.",
  alternates: { canonical: `${SITE_URL}/national-day` },
};

/**
 * صفحة الموسم كما تفعل نون وجرير: عدّ تنازلي، كود موحّد، كل عروض المحلات المشاركة.
 * التهنئة منفصلة عن العروض احتراماً لقواعد هوية الهيئة (لا ربط للشعار الرسمي بالبيع).
 */
export default async function NationalDay() {
  const now = new Date();
  const occ = currentOccasion(now);
  const soon = occ ? null : upcomingOccasion(now);
  const win = occasionEnd(now);
  const isNational = (occ ?? soon)?.key === "national";
  const code = OCCASION_COUPON.national;

  const [products, stores, coupon] = await Promise.all([
    q<any>(
      `SELECT p.id, p.slug, p.store_id, p.name_ar, p.description_ar, p.price, p.compare_price, p.image_path, p.unit, p.tags,
              p.in_stock, p.sort_order, p.is_active, p.views, p.variant_label, p.created_at, p.sale_ends_at,
              s.name_ar AS store_name, s.slug AS store_slug, s.district,
              (SELECT round(avg(r.rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='published') AS rating,
              (SELECT count(*)::int FROM reviews r WHERE r.product_id = p.id AND r.status='published') AS rating_count
       FROM products p JOIN stores s ON s.id = p.store_id AND s.is_active
       WHERE p.is_active AND $1 = ANY(p.tags) AND p.compare_price IS NOT NULL AND p.compare_price > p.price
         AND (p.sale_ends_at IS NULL OR p.sale_ends_at > now())
       ORDER BY (p.compare_price - p.price) / p.compare_price DESC, p.sort_order LIMIT 60`, [OCCASION_TAG]),
    q<any>(`SELECT DISTINCT s.id, s.name_ar, s.slug, s.district FROM stores s JOIN products p ON p.store_id = s.id
            WHERE s.is_active AND p.is_active AND $1 = ANY(p.tags) ORDER BY s.name_ar`, [OCCASION_TAG]),
    q<any>(`SELECT code, kind, value, expires_on FROM coupons WHERE upper(code) = $1 AND is_active
            AND (expires_on IS NULL OR expires_on >= current_date)`, [code]).then((r) => r[0]),
  ]);

  return (
    <div className="wrap">
      <section className="nd-hero">
        <p className="nd-greet">كل عام والوطن بخير — عزّنا بطبعنا</p>
        <h1>عروض اليوم الوطني <span className="tabular">٩٦</span> في بريدة</h1>
        {win && isNational && (
          <>
            <p className="nd-sub">{occ ? "العروض سارية حتى" : "تبدأ العروض ١٥ سبتمبر وتنتهي"} {win.ends.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", timeZone: "Asia/Riyadh" })}</p>
            <Countdown to={(occ ? win.ends : (occasionStart(now) ?? win.ends)).toISOString()} label={occ ? "الوقت المتبقّي على نهاية العروض" : "الوقت المتبقّي على بداية العروض"} />
          </>
        )}
        {coupon && (
          <div className="nd-code">
            <span>كود الخصم الموحّد على كل المول</span>
            <b className="tabular" dir="ltr">{coupon.code}</b>
            <small>{coupon.kind === "percent" ? `خصم ${Number(coupon.value)}٪` : `خصم ${Number(coupon.value)} ريال`} — يُكتب في صفحة إتمام الطلب، والمحل يلتزم به عند الاستلام</small>
          </div>
        )}
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="section-head">
          <h2>عروض المحلات المشاركة</h2>
          <span className="tabular">{products.length} عرضاً من {stores.length} {stores.length === 1 ? "محل" : "محلات"}</span>
        </div>
        {products.length === 0 ? (
          <div className="empty">
            <h3>العروض تُضاف الآن</h3>
            <p>المحلات تدخل عروضها من بوابة التاجر — عُد قريباً، أو تصفّح <Link href="/search?q=الكل&sale=1">كل العروض الجارية</Link>.</p>
          </div>
        ) : (
          <div className="grid">{products.map((p: any) => <ProductCard p={p} key={p.id} />)}</div>
        )}
      </section>

      {stores.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>المحلات المشاركة</h2></div>
          <div className="chips">
            {stores.map((s: any) => <Link key={s.id} href={`/store/${s.slug}`} className="chip">{s.name_ar}{s.district ? ` — حي ${s.district}` : ""}</Link>)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="panel" style={{ padding: 18 }}>
          <b>صاحب محل؟</b> شارك بعروضك من <Link href="/merchant/occasion">بوابة التاجر ← عروض اليوم الوطني</Link>: تختار منتجاتك ونسبة الخصم، ويضبط المول تاريخ الانتهاء ويعرضها هنا.
        </div>
      </section>
    </div>
  );
}
