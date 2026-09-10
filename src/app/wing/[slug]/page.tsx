import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import BrandTile from "@/components/BrandTile";
import { getWing, getWings, getProductsByWing, getBrands } from "@/lib/queries";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getWings()).map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const wing = await getWing((await params).slug);
  if (!wing) return {};
  return {
    title: `${wing.name_ar} في بريدة`,
    description: wing.tagline ?? `منتجات ${wing.name_ar} من محلات بريدة، بأسعارها وأصحابها.`,
  };
}

export default async function WingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wing = await getWing(slug);
  if (!wing) notFound();
  const [products, brands] = await Promise.all([getProductsByWing(slug), getBrands(slug)]);

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ {wing.name_ar}</nav>

      <section className="section" style={{ paddingTop: 20 }}>
        <h1 style={{ fontSize: "clamp(26px,4.2vw,38px)" }}>{wing.name_ar}</h1>
        {wing.tagline && <p style={{ color: "var(--text-2)", maxWidth: "56ch", marginTop: 10 }}>{wing.tagline}</p>}

      </section>

      <section className="section" style={{ paddingTop: 26 }}>
        <div className="section-head">
          <h2>ماركات القسم</h2>
          <span className="tabular">{brands.length}</span>
        </div>
        <div className="brand-wall">
          {brands.map((b) => <BrandTile b={b} key={b.id} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>المنتجات</h2>
          <span className="tabular">{products.length} منتجاً</span>
        </div>
        {products.length === 0 ? (
          <div className="empty">
            <h3>لا توجد منتجات في هذا الجناح بعد</h3>
            <p>المحلات مضافة، ومنتجاتها تُدخَل تباعاً.</p>
          </div>
        ) : (
          <div className="grid">{products.map((p) => <ProductCard p={p} key={p.id} />)}</div>
        )}
      </section>
    </div>
  );
}
