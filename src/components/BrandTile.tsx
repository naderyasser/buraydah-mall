import Link from "next/link";
import { DEST_META } from "@/lib/destinations";

/**
 * النموذج المزدوج كما في مواصفات العميل:
 * ماركة بلا منتجات = دليل، والضغط عليها يحوّل لموقعها مباشرة (/go/).
 * ماركة لها منتجات = تبيع داخل المول، فالضغط يفتح صفحتها.
 */
export default function BrandTile({ b }: { b: any }) {
  const sells = b.product_count > 0;
  const href = sells ? `/store/${b.slug}` : `/go/${b.slug}`;
  const external = !sells;

  return (
    <Link
      href={href}
      className="brand-tile"
      {...(external ? { rel: "nofollow sponsored", target: "_blank" } : {})}
    >
      {/* الشعار يحمل الاسم؛ لا نكرّره تحته إلا حين لا شعار للماركة */}
      {b.logo_path
        ? <img src={b.logo_path} alt={b.name_ar} loading="lazy" />
        : <b>{b.name_ar}</b>}
      {sells ? (
        <span className="mode sells">{b.product_count} منتجاً</span>
      ) : (
        <span className="mode links">{DEST_META[b.dest_type as keyof typeof DEST_META]?.label ?? "زيارة"} ↗</span>
      )}
    </Link>
  );
}
