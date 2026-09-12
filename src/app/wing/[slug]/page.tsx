import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BrandTile from "@/components/BrandTile";
import BrowseView, { optsFromParams } from "@/components/BrowseView";
import GoldStrip from "@/components/GoldStrip";
import { getWing, getWings, getBrands } from "@/lib/queries";
import { getCategories } from "@/lib/browse";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const wing = await getWing((await params).slug);
  if (!wing) return {};
  return {
    title: `${wing.name_ar} أونلاين في بريدة — أسعار محلات المدينة`,
    description:
      (wing.tagline ? wing.tagline + " " : "") +
      `تسوّق ${wing.name_ar} من محلات بريدة بأسعارها، الدفع عند الاستلام والتوصيل داخل المدينة.`,
  };
}

export default async function WingPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const wing = await getWing(slug);
  if (!wing) notFound();

  const [brands, cats] = await Promise.all([getBrands(slug), getCategories(slug)]);
  const opts = optsFromParams(sp, { wing: slug });

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) qs.set(k, v);

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ {wing.name_ar}</nav>

      <section className="section" style={{ paddingTop: 20, paddingBottom: 0 }}>
        <h1 style={{ fontSize: "clamp(26px,4.2vw,38px)" }}>{wing.name_ar}</h1>
        {wing.tagline && <p style={{ color: "var(--mut)", maxWidth: "56ch", marginTop: 10 }}>{wing.tagline}</p>}
        {slug === "gold" && <GoldStrip />}
      </section>

      {cats.length > 0 && (
        <div className="shortcuts">
          {cats.map((c: any) => (
            <Link key={c.slug} href={`/wing/${slug}?cat=${c.slug}`}
                  className={qs.get("cat") === c.slug ? "on" : ""}>
              {c.name_ar} <span className="tabular">{c.n}</span>
            </Link>
          ))}
        </div>
      )}

      <section className="section" style={{ paddingTop: 22 }}>
        <div className="section-head">
          <h2>ماركات القسم</h2>
          <span className="tabular">{brands.length}</span>
        </div>
        <div className="brand-wall">
          {brands.map((b: any) => <BrandTile b={b} key={b.id} />)}
        </div>
      </section>

      <BrowseView opts={opts} params={qs} action={`/wing/${slug}`} />
    </div>
  );
}
