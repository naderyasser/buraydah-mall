import Link from "next/link";
import Riyal from "./Riyal";
import { sar } from "@/lib/money";
import { agoAr } from "@/lib/time";
import { activeCompare, discountPct } from "./Price";

/**
 * سطر في «آخر ما أضيف» على طريقة حراج: صورة صغيرة، اسم، ثم الحي والوقت والمحل،
 * والسعر كشارة. الصف يُقرأ في ثانية، وهذا ما يجعل حراج سهلاً.
 */
export default function FeedRow({ p }: { p: any }) {
  const pct = discountPct(p.price, activeCompare(p));
  return (
    <Link href={`/product/${p.slug}`} className="feed-row">
      <span className="feed-img">{p.image_path ? <img src={p.image_path} alt="" loading="lazy" /> : null}</span>
      <span className="feed-body">
        <span className="feed-title">{p.name_ar}</span>
        <span className="feed-meta">
          {p.district && <span>حي {p.district}</span>}
          {p.created_at && <span>{agoAr(p.created_at)}</span>}
          <span>{p.store_name}</span>
        </span>
      </span>
      <span className="feed-price">
        <span><b className="tabular">{sar(p.price)}</b><Riyal /></span>
        {pct != null && <small className="tabular">−{pct}%</small>}
        {!p.in_stock && <small className="out">نفد</small>}
      </span>
    </Link>
  );
}
