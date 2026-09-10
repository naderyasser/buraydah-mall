import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BuyBox from "@/components/BuyBox";
import Gallery from "@/components/Gallery";
import Stars from "@/components/Stars";
import Favorite from "@/components/Favorite";
import ProductCard from "@/components/ProductCard";
import ReviewsBlock from "@/components/ReviewsBlock";
import QuestionsBlock from "@/components/QuestionsBlock";
import StockAlert from "@/components/StockAlert";
import ViewCounter from "@/components/ViewCounter";
import RememberSeen from "@/components/RememberSeen";
import RecentlyViewed from "@/components/RecentlyViewed";
import { discountPct } from "@/components/Price";
import { getProduct, getRelatedProducts } from "@/lib/queries";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return {
    title: `${p.name_ar} — ${p.store_name}`,
    description: p.description_ar ?? `${p.name_ar} من ${p.store_name} في بريدة، بسعر ${sar(p.price)} ر.س.`,
    alternates: { canonical: `${SITE_URL}/product/${p.slug}` },
    openGraph: {
      title: `${p.name_ar} — ${p.store_name}`,
      images: p.image_path ? [`${SITE_URL}${p.image_path}`] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();

  const [related, images, variants, reviews, questions, store] = await Promise.all([
    getRelatedProducts(p.store_id, p.id, 4),
    q<{ path: string }>(`SELECT path FROM product_images WHERE product_id = $1 ORDER BY sort_order, id`, [p.id]),
    q<any>(
      `SELECT id, name_ar, extra_price, in_stock FROM product_variants
       WHERE product_id = $1 ORDER BY sort_order, id`, [p.id]
    ),
    q<any>(
      `SELECT id, author_name, rating, body, reply, created_at FROM reviews
       WHERE product_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`, [p.id]
    ),
    q<any>(
      `SELECT id, author_name, body, answer, created_at FROM questions
       WHERE product_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 20`, [p.id]
    ),
    q<any>(
      `SELECT id, name_ar, slug, district, phone, is_verified, returns_policy,
              delivery_fee, free_delivery_over, cr_number, vat_number, maroof_number
       FROM stores WHERE id = $1`, [p.store_id]
    ).then((r) => r[0]),
  ]);

  const gallery = [p.image_path, ...images.map((i) => i.path)].filter(Boolean) as string[];
  const pct = discountPct(p.price, p.compare_price);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name_ar,
    description: p.description_ar ?? undefined,
    image: gallery.map((g) => `${SITE_URL}${g}`),
    brand: { "@type": "Brand", name: p.store_name },
    ...(p.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(p.rating),
            reviewCount: p.rating_count,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: Number(p.price),
      priceCurrency: "SAR",
      url: `${SITE_URL}/product/${p.slug}`,
      availability: p.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewCounter id={p.id} />
      <RememberSeen item={{ id: p.id, slug: p.slug, name: p.name_ar, price: Number(p.price), image: p.image_path }} />

      <nav className="crumbs">
        <Link href="/">الرئيسية</Link> ‹ <Link href={`/wing/${p.wing_slug}`}>{p.wing_name}</Link> ‹{" "}
        <Link href={`/store/${p.store_slug}`}>{p.store_name}</Link>
      </nav>

      <div className="product">
        <div>
          <Gallery images={gallery} alt={p.name_ar} />
        </div>

        <div className="product-info">
          <div className="ptitle">
            <h1>{p.name_ar}</h1>
            <Favorite id={p.id} size="lg" />
          </div>

          <p className="from">
            من <Link href={`/store/${p.store_slug}`}>{p.store_name}</Link>
            {store?.is_verified && <span className="badge verified">موثّق ✓</span>}
            {p.rating ? <Stars value={p.rating} count={p.rating_count} /> : null}
            {p.views > 0 && <span className="hint tabular">{p.views} مشاهدة</span>}
          </p>

          {pct != null && (
            <p className="save tabular">
              وفّر {sar(Number(p.compare_price) - Number(p.price))} ر.س — بدل{" "}
              <s>{sar(p.compare_price)}</s>
            </p>
          )}

          {p.in_stock ? (
            <BuyBox
              base={{
                productId: p.id, slug: p.slug, name: p.name_ar, price: Number(p.price),
                unit: p.unit, image: p.image_path, storeId: p.store_id,
                storeName: p.store_name, storeSlug: p.store_slug,
              }}
              variants={variants}
              variantLabel={p.variant_label}
              inStock={p.in_stock}
            />
          ) : (
            <StockAlert productId={p.id} />
          )}

          {p.description_ar && <p className="desc">{p.description_ar}</p>}

          {p.tags?.length > 0 && (
            <div className="chips">{p.tags.map((t: string) => <span className="chip" key={t}>{t}</span>)}</div>
          )}

          {Array.isArray(p.specs) && p.specs.length > 0 && (
            <div className="specs">
              <h3>المواصفات</h3>
              <dl>
                {p.specs.map((sp: any, i: number) => (
                  <div className="kv" key={i}><dt>{sp.k}</dt><dd>{sp.v}</dd></div>
                ))}
              </dl>
            </div>
          )}

          <ul className="assurances">
            <li>الدفع عند الاستلام — لا دفع إلكتروني داخل المول.</li>
            <li>
              {store?.free_delivery_over
                ? `توصيل داخل بريدة، ومجاناً فوق ${sar(store.free_delivery_over)} ر.س من هذا المحل.`
                : "استلام من المحل، أو توصيل داخل بريدة بالاتفاق مع المحل."}
            </li>
            <li>استرجاع خلال ٧ أيام من الاستلام وفق نظام التجارة الإلكترونية.</li>
            <li>السعر شامل ضريبة القيمة المضافة.</li>
          </ul>
        </div>
      </div>

      <ReviewsBlock
        reviews={reviews}
        storeId={p.store_id}
        productId={p.id}
        avg={p.rating}
        count={p.rating_count}
      />

      <QuestionsBlock questions={questions} productId={p.id} storeId={p.store_id} />

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>من نفس المحل</h2>
            <Link href={`/store/${p.store_slug}`}>كل منتجات {p.store_name}</Link>
          </div>
          <div className="grid">{related.map((r: any) => <ProductCard p={r} key={r.id} showStore={false} />)}</div>
        </section>
      )}

      <RecentlyViewed exclude={p.id} />
    </div>
  );
}
