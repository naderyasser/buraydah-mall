import { sar } from "@/lib/money";

/** السعر بالسعودي: الحالي أحمر، والمشطوب بجانبه، والخصم بنسبة مئوية */
export function discountPct(price: number | string, compare?: number | string | null): number | null {
  const p = Number(price), c = compare == null ? 0 : Number(compare);
  if (!c || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}

export default function Price({
  price, compare, unit, size = "md",
}: { price: number | string; compare?: number | string | null; unit?: string | null; size?: "md" | "lg" }) {
  const pct = discountPct(price, compare);
  return (
    <div className={size === "lg" ? "big-price" : "price"}>
      <b>{sar(price)}</b>
      <span className="cur">ر.س</span>
      {pct != null && (
        <>
          <s className="was tabular">{sar(compare!)}</s>
          <span className="off-badge tabular">خصم {pct}%</span>
        </>
      )}
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}
