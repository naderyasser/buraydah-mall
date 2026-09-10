import Link from "next/link";
import OpenNow from "./OpenNow";
import { DEST_META } from "@/lib/destinations";
import type { Store } from "@/lib/types";

export default function StoreCard({ store }: { store: Store }) {
  const meta = DEST_META[store.dest_type];
  return (
    <Link href={`/store/${store.slug}`} className={`store-card${store.tier === "featured" ? " featured" : ""}`}>
      <div className="logo-box">
        {store.logo_path ? (
          <img src={store.logo_path} alt={store.name_ar} loading="lazy" />
        ) : (
          <span className="logo-fallback">{store.name_ar}</span>
        )}
      </div>
      <div className="store-body">
        <h3>{store.name_ar}</h3>
        <span className="where">
          {store.district ? `حي ${store.district}` : store.city}
        </span>
        <div className="card-row">
          <OpenNow hours={store.hours} />
          {store.tier === "featured" && <span className="badge featured">مميّز</span>}
        </div>
        {store.tags?.length > 0 && (
          <div className="tags">
            {store.tags.slice(0, 3).map((t) => (
              <span className="tag" key={t}>{t}</span>
            ))}
          </div>
        )}
        <span className="where" style={{ color: "var(--text-3)", fontSize: 12.5 }}>
          {meta.label}
        </span>
      </div>
    </Link>
  );
}
