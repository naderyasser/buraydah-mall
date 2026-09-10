import Link from "next/link";
import ProductCard from "./ProductCard";

/** صف أفقي — يعرض أكثر في مساحة أقل، وهو عرف المتاجر السعودية */
export default function ProductRow({
  title, items, more, note,
}: { title: string; items: any[]; more?: { href: string; label: string }; note?: string }) {
  if (!items?.length) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {more ? <Link href={more.href}>{more.label}</Link> : note ? <span>{note}</span> : null}
      </div>
      <div className="prow">
        {items.map((p) => <ProductCard p={p} key={p.id} />)}
      </div>
    </section>
  );
}
