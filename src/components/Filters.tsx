import Link from "next/link";

type Facets = {
  categories: { slug: string; name_ar: string; n: number }[];
  stores: { id: number; slug: string; name_ar: string; n: number }[];
  districts: { district: string; n: number }[];
  bounds: { lo: number; hi: number; n: number; on_sale: number };
};

/**
 * لوحة الفلاتر — نموذج GET بلا جافاسكربت: كل حالة لها رابط يُشارَك ويُفهرَس.
 * الحي فلتر أساسي لا ثانوي: في مدينة واحدة، الحيّ هو ما يقرّر أين يشتري.
 */
export default function Filters({
  facets, params, action,
}: { facets: Facets; params: URLSearchParams; action: string }) {
  const val = (k: string) => params.get(k) ?? "";
  const has = (k: string) => params.get(k) === "1";
  const active = ["cat", "store", "district", "min", "max", "stock", "sale", "rating", "verified"]
    .some((k) => params.get(k));

  return (
    <form className="filters" action={action}>
      {val("q") && <input type="hidden" name="q" defaultValue={val("q")} />}
      {val("sort") && <input type="hidden" name="sort" defaultValue={val("sort")} />}

      <div className="filters-head">
        <h3>تصفية النتائج</h3>
        {active && <Link href={action + (val("q") ? `?q=${encodeURIComponent(val("q"))}` : "")}>مسح الكل</Link>}
      </div>

      {facets.categories.length > 0 && (
        <label className="fgroup">
          <span>التصنيف</span>
          <select name="cat" defaultValue={val("cat")}>
            <option value="">كل التصنيفات</option>
            {facets.categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name_ar} ({c.n})</option>
            ))}
          </select>
        </label>
      )}

      {facets.districts.length > 1 && (
        <label className="fgroup">
          <span>الحي</span>
          <select name="district" defaultValue={val("district")}>
            <option value="">كل أحياء بريدة</option>
            {facets.districts.map((d) => (
              <option key={d.district} value={d.district}>{d.district} ({d.n})</option>
            ))}
          </select>
        </label>
      )}

      {facets.stores.length > 1 && (
        <label className="fgroup">
          <span>المحل</span>
          <select name="store" defaultValue={val("store")}>
            <option value="">كل المحلات</option>
            {facets.stores.map((s) => (
              <option key={s.id} value={s.slug}>{s.name_ar} ({s.n})</option>
            ))}
          </select>
        </label>
      )}

      <div className="fgroup">
        <span>السعر (ر.س)</span>
        <div className="frange">
          <input name="min" type="number" min={0} inputMode="numeric" dir="ltr"
                 placeholder={String(facets.bounds.lo ?? 0)} defaultValue={val("min")} />
          <em>إلى</em>
          <input name="max" type="number" min={0} inputMode="numeric" dir="ltr"
                 placeholder={String(facets.bounds.hi ?? 0)} defaultValue={val("max")} />
        </div>
      </div>

      <label className="fgroup">
        <span>التقييم</span>
        <select name="rating" defaultValue={val("rating")}>
          <option value="">كل التقييمات</option>
          <option value="4">★ ٤ فأعلى</option>
          <option value="3">★ ٣ فأعلى</option>
        </select>
      </label>

      <label className="fcheck">
        <input type="checkbox" name="stock" value="1" defaultChecked={has("stock")} />
        <span>المتوفّر الآن فقط</span>
      </label>

      <label className="fcheck">
        <input type="checkbox" name="verified" value="1" defaultChecked={has("verified")} />
        <span>محلات موثّقة فقط</span>
      </label>

      {facets.bounds.on_sale > 0 && (
        <label className="fcheck">
          <input type="checkbox" name="sale" value="1" defaultChecked={has("sale")} />
          <span>عليه تخفيض <b className="tabular">({facets.bounds.on_sale})</b></span>
        </label>
      )}

      <button className="btn btn-brand btn-block" type="submit">طبّق التصفية</button>
    </form>
  );
}
