import { sar } from "@/lib/money";
import Riyal from "@/components/Riyal";

/** السعر بالسعودي: الحالي أحمر، والمشطوب بجانبه، والخصم بنسبة مئوية */
export function discountPct(price: number | string, compare?: number | string | null): number | null {
  const p = Number(price), c = compare == null ? 0 : Number(compare);
  if (!c || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
}

/** السعر المشطوب يُعرض ما دام العرض سارياً — بعد `sale_ends_at` يعود المنتج لسعره بلا خصم */
export function activeCompare(p: { compare_price?: number | string | null; sale_ends_at?: string | Date | null }) {
  if (p.sale_ends_at && new Date(p.sale_ends_at).getTime() < Date.now()) return null;
  return p.compare_price ?? null;
}

/** «ينتهي العرض خلال ٣ ساعات» — الاستعجال الذي يبيع في جرير ونون */
export function saleEndsLabel(when?: string | Date | null): string | null {
  if (!when) return null;
  const ms = new Date(when).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.ceil(ms / 36e5);
  const AR = (n: number) => n.toLocaleString("ar-EG");
  if (h <= 1) return "ينتهي العرض خلال ساعة";
  if (h < 24) return `ينتهي العرض خلال ${AR(h)} ساعة`;
  const d = Math.ceil(h / 24);
  if (d === 1) return "ينتهي العرض غداً";
  if (d === 2) return "ينتهي العرض بعد يومين";
  return `ينتهي العرض خلال ${AR(d)} أيام`;
}

export default function Price({
  price, compare, unit, size = "md",
}: { price: number | string; compare?: number | string | null; unit?: string | null; size?: "md" | "lg" }) {
  const pct = discountPct(price, compare);
  return (
    <div className={size === "lg" ? "big-price" : "price"}>
      <b>{sar(price)}</b>
      <span className="cur"><Riyal /></span>
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
