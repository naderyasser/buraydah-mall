import Link from "next/link";
import AddToCart from "./AddToCart";
import { sar } from "@/lib/money";
import type { ProductWithStore } from "@/lib/types";

export default function ProductCard({ p, showStore = true }: { p: ProductWithStore; showStore?: boolean }) {
  return (
    <article className="pcard">
      <Link href={`/product/${p.slug}`} className="pcard-img">
        {p.image_path
          ? <img src={p.image_path} alt={p.name_ar} loading="lazy" />
          : <span />}
        {showStore && <span className="pcard-store">{p.store_name}</span>}
      </Link>
      <div className="pcard-body">
        <h3><Link href={`/product/${p.slug}`}>{p.name_ar}</Link></h3>
        {p.description_ar && <p className="desc">{p.description_ar}</p>}
        <div className="price">
          <b>{sar(p.price)}</b>
          <span className="cur">ر.س</span>
          {p.unit && <span className="unit">{p.unit}</span>}
        </div>
        <AddToCart
          item={{
            productId: p.id, slug: p.slug, name: p.name_ar, price: Number(p.price),
            unit: p.unit, image: p.image_path, storeId: p.store_id,
            storeName: p.store_name, storeSlug: p.store_slug,
          }}
        />
      </div>
    </article>
  );
}
