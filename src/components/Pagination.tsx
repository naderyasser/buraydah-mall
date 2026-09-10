import Link from "next/link";

/** ترقيم الصفحات — روابط حقيقية تُفهرَس وتُشارَك */
export default function Pagination({ page, pages, params }: { page: number; pages: number; params: URLSearchParams }) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const p = new URLSearchParams(params.toString());
    if (n === 1) p.delete("page"); else p.set("page", String(n));
    const s = p.toString();
    return s ? `?${s}` : "?";
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);

  return (
    <nav className="pager" aria-label="صفحات النتائج">
      {page > 1 && <Link href={href(page - 1)}>السابق</Link>}
      {nums.map((n, i) => (
        <span key={n}>
          {i > 0 && n - nums[i - 1] > 1 && <span className="gap">…</span>}
          <Link href={href(n)} className={`tabular${n === page ? " on" : ""}`}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link href={href(page + 1)}>التالي</Link>}
    </nav>
  );
}
