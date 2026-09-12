import Link from "next/link";
import type { Metadata } from "next";
import StoreCard from "@/components/StoreCard";
import { q } from "@/db";
import { getWings } from "@/lib/queries";
import { isOpenNow } from "@/lib/hours";
import type { Store } from "@/lib/types";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "دليل محلات بريدة — كل المحلات حسب الحي والقسم",
  description: "كل محلات مول بريدة في صفحة واحدة: صفّها بالحي أو القسم، واعرف المفتوح الآن.",
  alternates: { canonical: `${SITE_URL}/stores` },
};

/**
 * دليل المحلات (ما تملكه «محلي» و«متاجر الحي» ولا يملكه نون): المحل نفسه منتج
 * في سوق محلي — الحي والدوام والاتجاهات أهم عند مشتري بريدة من ترتيب الماركات.
 */
export default async function StoresPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const wing = sp.wing || "";
  const district = sp.district || "";
  const openOnly = sp.open === "1";

  const [wings, stores, districts] = await Promise.all([
    getWings(),
    q<Store & { wing_slug: string; product_count: number }>(
      `SELECT s.*, w.slug AS wing_slug,
              (SELECT count(*)::int FROM products p WHERE p.store_id = s.id AND p.is_active) AS product_count
       FROM stores s JOIN wings w ON w.id = s.wing_id AND w.is_active
       WHERE s.is_active AND ($1 = '' OR w.slug = $1) AND ($2 = '' OR s.district = $2)
       ORDER BY CASE s.tier WHEN 'featured' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END, s.merit_pinned DESC, s.sort_order, s.name_ar`,
      [wing, district]
    ),
    q<{ district: string; n: number }>(
      `SELECT district, count(*)::int AS n FROM stores WHERE is_active AND district IS NOT NULL
       GROUP BY district ORDER BY n DESC, district`
    ),
  ]);

  const list = openOnly ? stores.filter((s) => isOpenNow(s.hours as any) === true) : stores;
  const link = (patch: Record<string, string>) => {
    const u = new URLSearchParams();
    const next = { wing, district, open: openOnly ? "1" : "", ...patch };
    for (const [k, v] of Object.entries(next)) if (v) u.set(k, v);
    const qs = u.toString();
    return `/stores${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ دليل المحلات</nav>
      <section className="section" style={{ paddingTop: 10 }}>
        <div className="section-head">
          <h1 style={{ fontSize: "clamp(24px,4vw,32px)" }}>دليل محلات بريدة</h1>
          <span className="hint tabular">{list.length} محلاً</span>
        </div>

        <div className="chips" style={{ marginTop: 6 }}>
          <Link href={link({ wing: "" })} className={`chip${!wing ? " on" : ""}`}>كل الأقسام</Link>
          {wings.map((w) => (
            <Link key={w.slug} href={link({ wing: w.slug })} className={`chip${wing === w.slug ? " on" : ""}`}>{w.name_ar}</Link>
          ))}
        </div>
        {districts.length > 0 && (
          <div className="chips" style={{ marginTop: 8 }}>
            <Link href={link({ district: "" })} className={`chip${!district ? " on" : ""}`}>كل الأحياء</Link>
            {districts.map((d) => (
              <Link key={d.district} href={link({ district: d.district })} className={`chip${district === d.district ? " on" : ""}`}>
                حي {d.district} <small className="tabular">({d.n})</small>
              </Link>
            ))}
          </div>
        )}
        <div className="chips" style={{ marginTop: 8 }}>
          <Link href={link({ open: openOnly ? "" : "1" })} className={`chip${openOnly ? " on" : ""}`}>مفتوح الآن</Link>
        </div>

        {list.length === 0 ? (
          <div className="empty" style={{ marginTop: 20 }}>
            <h3>لا محلات بهذه الشروط</h3>
            <p>جرّب حيّاً أو قسماً آخر، أو <Link href="/requests">اطلب ما لا تجده</Link> وستعرض عليك المحلات.</p>
          </div>
        ) : (
          <div className="brand-wall" style={{ marginTop: 18 }}>
            {list.map((s) => <StoreCard store={s} key={s.id} />)}
          </div>
        )}
      </section>
    </div>
  );
}
