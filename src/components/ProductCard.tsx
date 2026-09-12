import Link from "next/link";
import AddToCart from "./AddToCart";
import Stars from "./Stars";
import Favorite from "./Favorite";
import Price, { discountPct, activeCompare, saleEndsLabel } from "./Price";
import { agoAr } from "@/lib/time";
import { OCCASION_TAG } from "@/lib/saudi";
import type { ProductWithStore } from "@/lib/types";

/** وسم «صناعة سعودية» أو «منتج محلي» يظهر كشارة — ما يميّز تفصيل بريدة عن المستورد */
export function isSaudiMade(tags?: string[] | null) {
  return !!tags?.some((t) => /سعودي|محلي|صنع في السعودية|تفصيل/.test(t));
}

export default function ProductCard({
  p, showStore = true,
}: { p: ProductWithStore & Record<string, any>; showStore?: boolean }) {
  const compare = activeCompare(p);
  const pct = discountPct(p.price, compare);
  const ends = pct != null ? saleEndsLabel(p.sale_ends_at) : null;
  const fresh = p.created_at && Date.now() - new Date(p.created_at).getTime() < 14 * 864e5;

  return (
    <article className="pcard">
      <Link href={`/product/${p.slug}`} className="pcard-img">
        {p.image_path
          ? <img src={p.image_path} alt={p.name_ar} loading="lazy" />
          : <span />}
        {pct != null && <span className="pcard-off tabular">−{pct}%</span>}
        {pct != null && p.tags?.includes(OCCASION_TAG) && <span className="pcard-occ">عرض اليوم الوطني</span>}
        {!p.in_stock && <span className="pcard-out">نفد</span>}
        {isSaudiMade(p.tags) && <span className="pcard-sa">صنع في السعودية</span>}
      </Link>
      <Favorite id={p.id} />
      <div className="pcard-body">
        <h3><Link href={`/product/${p.slug}`}>{p.name_ar}</Link></h3>
        {showStore && (
          <Link href={`/store/${p.store_slug}`} className="pcard-shop">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10 5 4h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v9h14v-9" /></svg>
            {p.store_name}
          </Link>
        )}
        {p.rating ? <Stars value={p.rating} count={p.rating_count} /> : null}
        {p.description_ar && <p className="desc">{p.description_ar}</p>}
        <Price price={p.price} compare={compare} unit={p.unit} />
        {ends && <span className="sale-ends">{ends}</span>}
        {(p.district || (fresh && p.created_at)) && (
          <span className="pcard-meta">
            {p.district && <span>حي {p.district}</span>}
            {fresh && p.created_at && <span>{agoAr(p.created_at)}</span>}
          </span>
        )}
        <AddToCart
          item={{
            productId: p.id, slug: p.slug, name: p.name_ar, price: Number(p.price),
            unit: p.unit, image: p.image_path, storeId: p.store_id,
            storeName: p.store_name, storeSlug: p.store_slug,
            variantId: null, variantName: null,
          }}
          hasVariants={!!p.variant_label}
          inStock={p.in_stock}
        />
      </div>
    </article>
  );
}
