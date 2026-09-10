import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { searchProducts, searchStores } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "البحث" };

const SUGGESTIONS = ["فساتين سهرة", "عيار 21", "قماش عباية", "ساعة", "حقيبة جلد", "طقم عيد"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const term = ((await searchParams).q ?? "").trim();
  const wide = term === "الكل";
  const [products, stores] = term.length >= 2
    ? await Promise.all([searchProducts(wide ? "" : term), wide ? [] : searchStores(term)])
    : [[], []];

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ البحث</nav>
      <section className="section" style={{ paddingTop: 18 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,34px)" }}>ابحث في المول</h1>
        <p style={{ color: "var(--text-2)", marginTop: 8 }}>بالمنتج أو بالمحل أو بالسلعة نفسها.</p>
        <form className="hero-search" action="/search" style={{ marginTop: 18 }}>
          <input name="q" defaultValue={wide ? "" : term} placeholder="اكتب ما تبحث عنه" aria-label="بحث"
            style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--line-2)" }} />
          <button type="submit" style={{ background: "var(--chrome)", color: "var(--chrome-text)" }}>ابحث</button>
        </form>
        <div className="chips" style={{ marginTop: 14 }}>
          {SUGGESTIONS.map((s) => (
            <Link className="chip" key={s} href={`/search?q=${encodeURIComponent(s)}`}>{s}</Link>
          ))}
        </div>
      </section>

      {term.length >= 2 && (
        <>
          {stores.length > 0 && (
            <section className="section">
              <div className="section-head"><h2>محلات</h2><span className="tabular">{stores.length}</span></div>
              <div className="wings-strip">
                {stores.map((s: any) => (
                  <Link key={s.id} href={`/store/${s.slug}`} className="wing-pill">
                    <b>{s.name_ar}</b>
                    {s.district && <i>حي {s.district}</i>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <h2>{wide ? "كل المنتجات" : "منتجات"}</h2>
              <span className="tabular">{products.length}</span>
            </div>
            {products.length === 0 ? (
              <div className="empty">
                <h3>لا توجد نتائج لـ «{term}»</h3>
                <p>جرّب كلمة أعمّ، أو تصفّح الأجنحة من الرئيسية.</p>
              </div>
            ) : (
              <div className="grid">{products.map((p: any) => <ProductCard p={p} key={p.id} />)}</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
