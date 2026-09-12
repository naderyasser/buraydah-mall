import Link from "next/link";
import Riyal from "@/components/Riyal";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import OpenNow from "@/components/OpenNow";
import HoursTable from "@/components/HoursTable";
import ProductCard from "@/components/ProductCard";
import ReviewsBlock from "@/components/ReviewsBlock";
import FollowStore from "@/components/FollowStore";
import Stars from "@/components/Stars";
import { readyPromise, holdNote } from "@/lib/promise";
import { getStore, getProductsByStore } from "@/lib/queries";
import { q, q1 } from "@/db";
import { DEST_META, buildDestUrl } from "@/lib/destinations";
import type { Wing } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getStore((await params).slug);
  if (!s) return {};
  const where = s.district ? `حي ${s.district} — بريدة` : "بريدة";
  return {
    title: `${s.name_ar} — ${where}`,
    description: s.summary_ar ?? `${s.name_ar} في ${where}. المنتجات والأسعار والعنوان والدوام.`,
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const store = await getStore((await params).slug);
  if (!store) notFound();
  const [wing, products, reviews, rating] = await Promise.all([
    q1<Wing>(`SELECT * FROM wings WHERE id = $1`, [store.wing_id]),
    getProductsByStore(store.id),
    q<any>(
      `SELECT id, author_name, rating, body, reply, created_at, image_path FROM reviews
       WHERE store_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`,
      [store.id]
    ),
    q1<any>(
      `SELECT round(avg(rating),1) AS avg, count(*)::int AS n FROM reviews
       WHERE store_id = $1 AND status = 'published'`,
      [store.id]
    ),
  ]);
  const meta = DEST_META[store.dest_type];
  const mapUrl = store.map_url || (store.address_line
    ? `https://maps.google.com/?q=${encodeURIComponent(`${store.name_ar} ${store.address_line} بريدة`)}`
    : null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name_ar,
    description: store.summary_ar ?? undefined,
    telephone: store.phone ?? undefined,
    url: buildDestUrl(store),
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address_line ?? undefined,
      addressLocality: store.city,
      addressCountry: "SA",
    },
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs">
        <Link href="/">الرئيسية</Link> ‹{" "}
        {wing && <Link href={`/wing/${wing.slug}`}>{wing.name_ar}</Link>} ‹ {store.name_ar}
      </nav>

      <section className="store-hero">
        <div className="store-logo">
          {store.logo_path ? <img src={store.logo_path} alt={store.name_ar} /> : <span>{store.name_ar}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1>
            {store.name_ar}
            {store.is_verified && <span className="badge verified" style={{ marginInlineStart: 10 }}>موثّق ✓</span>}
            {store.badge_year && (
              <span className="badge gold" style={{ marginInlineStart: 8 }}>
                تاجر مميّز {store.badge_year}
              </span>
            )}
          </h1>
          {store.summary_ar && <p style={{ color: "var(--text-2)", margin: "8px 0 0", maxWidth: "58ch" }}>{store.summary_ar}</p>}
          <div className="store-facts">
            <OpenNow hours={store.hours} />
            {rating?.avg && <Stars value={rating.avg} count={rating.n} />}
            {store.district && <span>حي {store.district}</span>}
            {store.phone && <span className="tabular" dir="ltr">{store.phone}</span>}
            <span className="tabular">{products.length} منتجاً</span>
          </div>
          <div className="buy-row" style={{ marginTop: 14 }}>
            <a className="btn btn-dark btn-sm" href={`/go/${store.slug}`} rel="nofollow sponsored">{meta.button}</a>
            {mapUrl && <a className="btn btn-line btn-sm" href={mapUrl} target="_blank" rel="noopener nofollow">خذني إليه</a>}
            <FollowStore storeId={store.id} storeName={store.name_ar} />
          </div>
        </div>
      </section>

      {products.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <h2>منتجات المحل</h2>
            <span className="tabular">{products.length}</span>
          </div>
          <div className="grid">{products.map((p) => <ProductCard p={p} key={p.id} showStore={false} />)}</div>
        </section>
      ) : (
        <section className="section">
          <div className="empty">
            <h3>هذه الماركة تبيع عبر متجرها الخاص</h3>
            <p style={{ maxWidth: "48ch", marginInline: "auto" }}>
              لا نعرض منتجاتها داخل المول — يوصلك المول إليها مباشرة، والشراء
              والتسليم يتمّان معها.
            </p>
            <a className="btn btn-gold" href={`/go/${store.slug}`} rel="nofollow sponsored"
               style={{ marginTop: 16 }}>{meta.button}</a>
          </div>
        </section>
      )}

      <ReviewsBlock reviews={reviews} storeId={store.id} avg={rating?.avg} count={rating?.n} />

      <div className="panels">
        <div className="panel">
          <h4>أين تجده</h4>
          <dl className="hours-list">
            <div className="kv"><dt>المدينة</dt><dd>{store.city}</dd></div>
            {store.district && <div className="kv"><dt>الحي</dt><dd>{store.district}</dd></div>}
            {store.address_line && <div className="kv"><dt>العنوان</dt><dd>{store.address_line}</dd></div>}
            {store.phone && <div className="kv"><dt>الجوال</dt><dd className="tabular" dir="ltr">{store.phone}</dd></div>}
          </dl>
        </div>
        <div className="panel">
          <h4>الدوام</h4>
          <HoursTable hours={store.hours} />
        </div>

        <div className="panel">
          <h4>التوصيل والاسترجاع</h4>
          <dl className="hours-list">
            <div className="kv">
              <dt>الاستلام من المحل</dt><dd>مجاناً في الدوام</dd>
            </div>
            <div className="kv">
              <dt>وعد الجاهزية</dt>
              <dd>{readyPromise(store.hours, (store as any).ready_minutes ?? 60)}</dd>
            </div>
            <div className="kv">
              <dt>مدّة الحجز</dt><dd>{holdNote((store as any).hold_days ?? 3)}</dd>
            </div>
            <div className="kv">
              <dt>التوصيل داخل بريدة</dt>
              <dd>{Number(store.delivery_fee) > 0 ? `${Number(store.delivery_fee)} ر.س` : "بالاتفاق مع المحل"}</dd>
            </div>
            {store.free_delivery_over && (
              <div className="kv">
                <dt>توصيل مجاني</dt><dd>فوق {Number(store.free_delivery_over)} <Riyal /></dd>
              </div>
            )}
          </dl>
          <p className="hint" style={{ marginTop: 8 }}>
            {store.returns_policy || "الاسترجاع خلال ٧ أيام من الاستلام مع المحل وبفاتورته."}
          </p>
        </div>

        <div className="panel">
          <h4>بيانات المحل النظامية</h4>
          <dl className="hours-list">
            <div className="kv"><dt>الاسم التجاري</dt><dd>{store.name_ar}</dd></div>
            {store.cr_number && <div className="kv"><dt>السجل التجاري</dt><dd className="tabular" dir="ltr">{store.cr_number}</dd></div>}
            {store.vat_number && <div className="kv"><dt>الرقم الضريبي</dt><dd className="tabular" dir="ltr">{store.vat_number}</dd></div>}
            {store.maroof_number && <div className="kv"><dt>معروف</dt><dd className="tabular" dir="ltr">{store.maroof_number}</dd></div>}
          </dl>
          <p className="hint" style={{ marginTop: 8 }}>
            الأسعار شاملة ضريبة القيمة المضافة. البيع والفاتورة من المحل نفسه.
          </p>
        </div>
      </div>

      <p className="hint" style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span>
          آخر تحديث للبيانات:{" "}
          <span className="tabular">
            {new Date(store.data_updated_at).toLocaleDateString("ar-SA-u-nu-latn", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </span>
        <Link href={`/report/${store.slug}`} style={{ color: "var(--gold)", textDecoration: "underline" }}>
          أبلغ عن خطأ في البيانات
        </Link>
      </p>
    </div>
  );
}
