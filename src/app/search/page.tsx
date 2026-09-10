import Link from "next/link";
import BrowseView, { optsFromParams } from "@/components/BrowseView";
import { searchStores } from "@/lib/queries";
import { getTrendingSearches } from "@/lib/browse";
import { logSearch } from "@/app/actions";
import FollowTerm from "@/components/FollowTerm";

export const dynamic = "force-dynamic";
export const metadata = { title: "البحث" };

const SUGGESTIONS = ["فساتين سهرة", "عيار 21", "قماش عباية", "ساعة", "حقيبة جلد", "طقم عيد"];

export default async function SearchPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const raw = typeof sp.q === "string" ? sp.q.trim() : "";
  const wide = raw === "الكل";
  const term = wide ? "" : raw;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) qs.set(k, v);

  const opts = optsFromParams(sp, {});
  if (wide) opts.term = undefined;

  const [stores, trending] = await Promise.all([
    term.length >= 2 ? searchStores(term) : Promise.resolve([]),
    getTrendingSearches(8),
  ]);

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ البحث</nav>

      <section className="section" style={{ paddingTop: 18, paddingBottom: 10 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,34px)" }}>
          {raw ? <>نتائج «{raw}»</> : "ابحث في المول"}
        </h1>
        <form className="hero-search" action="/search" style={{ marginTop: 16 }}>
          <input name="q" defaultValue={wide ? "" : term} placeholder="اكتب ما تبحث عنه" aria-label="بحث" />
          <button type="submit">ابحث</button>
        </form>

        <div className="chips" style={{ marginTop: 14 }}>
          {(trending.length ? trending.map((t) => t.term) : SUGGESTIONS).map((s) => (
            <Link className="chip" key={s} href={`/search?q=${encodeURIComponent(s)}`}>{s}</Link>
          ))}
        </div>
      </section>

      {stores.length > 0 && (
        <section className="section" style={{ paddingBlock: 10 }}>
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

      <BrowseView
        opts={opts}
        params={qs}
        action="/search"
        empty={
          <div className="empty">
            <h3>لا توجد نتائج{raw && ` لـ «${raw}»`}</h3>
            <p>جرّب كلمة أعمّ، أو تصفّح الأقسام من الرئيسية.</p>
            {term.length >= 2 && (
              <>
                <FollowTerm term={term} />
                <p className="hint" style={{ marginTop: 10 }}>
                  أو <Link href="/requests">انشر طلب شراء</Link> وتعرض عليك المحلات مباشرة.
                </p>
              </>
            )}
          </div>
        }
      />
      {term.length >= 2 && <LogTerm term={term} />}
    </div>
  );
}

/** يُسجّل ما بحث عنه الناس — يكشف ما يطلبه أهل بريدة ولا نعرضه */
async function LogTerm({ term }: { term: string }) {
  await logSearch(term);
  return null;
}
