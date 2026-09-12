import Link from "next/link";
import { hijriDate, nextPrayer, currentOccasion } from "@/lib/saudi";

/**
 * الشريط العلوي يقول ما يهمّ مشتري بريدة اليوم: التاريخ الهجري، الصلاة القادمة
 * (المحلات تغلق أبوابها وقت الصلاة فعلياً)، والمناسبة الجارية إن وُجدت.
 */
export default function TopStrip() {
  const now = new Date();
  const p = nextPrayer(now);
  const occ = currentOccasion(now);
  return (
    <div className={`topstrip${occ ? ` occ-${occ.key}` : ""}`}>
      <div className="wrap">
        <span className="ts-date">{hijriDate(now, { weekday: true })}</span>
        <span className="ts-prayer" title="مواقيت بريدة — تقريبية بمعايير أم القرى">الصلاة القادمة: {p.name} <b className="tabular">{p.time}</b></span>
        {occ
          ? <Link href={occ.key === "national" ? "/national-day" : "/search?q=الكل&sale=1"} className="ts-occ">{occ.label} — {occ.note}</Link>
          : <span className="ts-promise">التوصيل داخل بريدة · الدفع عند الاستلام · استرجاع خلال ٧ أيام</span>}
      </div>
    </div>
  );
}
