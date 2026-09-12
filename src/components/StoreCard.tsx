import Link from "next/link";
import OpenNow from "./OpenNow";
import { DEST_META } from "@/lib/destinations";
import type { Store } from "@/lib/types";

/**
 * بطاقة المحل في الدليل: ما يهمّ مشتري بريدة أولاً — الحي، مفتوح الآن، والاتجاهات.
 * ليست رابطاً واحداً لأن فيها رابطين (الصفحة والاتجاهات) ولا يجوز تداخل الروابط.
 */
export default function StoreCard({ store }: { store: Store & { product_count?: number; wing_slug?: string } }) {
  const sells = (store.product_count ?? 0) > 0;
  const href = sells ? `/store/${store.slug}` : `/go/${store.slug}`;
  return (
    <article className={`scard${store.tier === "featured" ? " featured" : ""}`}>
      <Link href={href} className="scard-logo" {...(sells ? {} : { rel: "nofollow sponsored", target: "_blank" })}>
        {store.logo_path
          ? <img src={store.logo_path} alt={store.name_ar} loading="lazy" />
          : <b>{store.name_ar}</b>}
      </Link>
      <div className="scard-body">
        <h3><Link href={href}>{store.name_ar}</Link>{store.is_verified && <span className="badge verified">✓</span>}</h3>
        <span className="where">{store.district ? `حي ${store.district}` : store.city || "بريدة"}</span>
        <div className="card-row">
          <OpenNow hours={store.hours as any} />
          {sells
            ? <span className="mode sells">{store.product_count} منتجاً</span>
            : <span className="mode links">{DEST_META[store.dest_type as keyof typeof DEST_META]?.label ?? "زيارة"} ↗</span>}
        </div>
        {store.map_url && (
          <a href={store.map_url} target="_blank" rel="noopener nofollow" className="scard-dir">الاتجاهات ↗</a>
        )}
      </div>
    </article>
  );
}
