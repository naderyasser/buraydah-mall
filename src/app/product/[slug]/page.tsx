import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";
import { getProduct, getRelatedProducts } from "@/lib/queries";
import { sar } from "@/lib/money";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return {
    title: `${p.name_ar} — ${p.store_name}`,
    description: p.description_ar ?? `${p.name_ar} من ${p.store_name} في بريدة، بسعر ${sar(p.price)} ر.س.`,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const related = await getRelatedProducts(p.store_id, p.id, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name_ar,
    description: p.description_ar ?? undefined,
    brand: { "@type": "Brand", name: p.store_name },
    offers: {
      "@type": "Offer",
      price: Number(p.price),
      priceCurrency: "SAR",
      availability: p.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs">
        <Link href="/">الرئيسية</Link> ‹ <Link href={`/wing/${p.wing_slug}`}>{p.wing_name}</Link> ‹{" "}
        <Link href={`/store/${p.store_slug}`}>{p.store_name}</Link>
      </nav>

      <div className="product">
        <div className="product-img">
          {p.image_path && <img src={p.image_path} alt={p.name_ar} />}
        </div>
        <div>
          <h1>{p.name_ar}</h1>
          <p className="from">
            من <Link href={`/store/${p.store_slug}`}>{p.store_name}</Link>
            {p.in_stock ? <span className="badge open" style={{ marginInlineStart: 10 }}>متوفّر</span>
                        : <span className="badge closed" style={{ marginInlineStart: 10 }}>غير متوفّر</span>}
          </p>

          <div className="big-price">
            <b>{sar(p.price)}</b>
            <span className="cur">ر.س</span>
            {p.unit && <span className="unit">{p.unit}</span>}
          </div>

          {p.description_ar && <p className="desc">{p.description_ar}</p>}

          {p.tags?.length > 0 && (
            <div className="chips">{p.tags.map((t: string) => <span className="chip" key={t}>{t}</span>)}</div>
          )}

          <div className="buy-row">
            <AddToCart
              withQty
              size="lg"
              label="أضف إلى السلة"
              item={{
                productId: p.id, slug: p.slug, name: p.name_ar, price: Number(p.price),
                unit: p.unit, image: p.image_path, storeId: p.store_id,
                storeName: p.store_name, storeSlug: p.store_slug,
              }}
            />
          </div>
          <p className="hint" style={{ marginTop: 14 }}>
            الدفع عند الاستلام أو مع المحل مباشرة — لا دفع إلكتروني داخل المول.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>من نفس المحل</h2>
            <Link href={`/store/${p.store_slug}`}>كل منتجات {p.store_name}</Link>
          </div>
          <div className="grid">{related.map((r) => <ProductCard p={r} key={r.id} showStore={false} />)}</div>
        </section>
      )}
    </div>
  );
}
