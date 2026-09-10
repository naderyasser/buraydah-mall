import ProductCard from "./ProductCard";
import Filters from "./Filters";
import SortBar from "./SortBar";
import Pagination from "./Pagination";
import { browseProducts, getFacets, type BrowseOpts } from "@/lib/browse";
import type { SortKey } from "@/lib/sorts";

const SORT_KEYS = ["featured", "newest", "price_asc", "price_desc", "popular", "rating"];

/** يقرأ الفلاتر من رابط الصفحة — مصدر واحد للحقيقة بين /wing و /search و /store */
export function optsFromParams(sp: Record<string, string | string[] | undefined>, base: BrowseOpts = {}): BrowseOpts {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v >= 0 ? v : undefined;
  };
  const sort = one("sort");
  return {
    ...base,
    category: one("cat"),
    district: one("district"),
    term: one("q"),
    min: num("min"),
    max: num("max"),
    inStock: one("stock") === "1",
    onSale: one("sale") === "1",
    verified: one("verified") === "1",
    minRating: num("rating"),
    sort: SORT_KEYS.includes(sort ?? "") ? (sort as SortKey) : "featured",
    page: num("page") ?? 1,
  };
}

export default async function BrowseView({
  opts, params, action, empty,
}: {
  opts: BrowseOpts;
  params: URLSearchParams;
  action: string;
  empty?: React.ReactNode;
}) {
  // فلتر المحل يأتي من الرابط بالـslug — يُترجم إلى معرّف قبل الاستعلام
  const storeSlug = params.get("store");
  const scoped: BrowseOpts = { ...opts };
  if (storeSlug && !opts.storeId) {
    const { getStore } = await import("@/lib/queries");
    const s = await getStore(storeSlug);
    if (s) scoped.storeId = s.id;
  }

  const [result, facets] = await Promise.all([browseProducts(scoped), getFacets(scoped)]);

  return (
    <div className="browse">
      <aside className="browse-side">
        <Filters facets={facets} params={params} action={action} />
      </aside>

      <div className="browse-main">
        <SortBar total={result.total} />

        {result.rows.length === 0 ? (
          empty ?? (
            <div className="empty">
              <h3>لا توجد نتائج بهذه التصفية</h3>
              <p>وسّع نطاق السعر أو امسح الفلاتر وجرّب من جديد.</p>
            </div>
          )
        ) : (
          <>
            <div className="grid">
              {result.rows.map((p) => <ProductCard p={p} key={p.id} />)}
            </div>
            <Pagination page={result.page} pages={result.pages} params={params} />
          </>
        )}
      </div>
    </div>
  );
}
