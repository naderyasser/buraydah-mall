import { prayerTimes, nextPrayer, hijriDate } from "@/lib/saudi";

/** بطاقة مواقيت الصلاة كما في تصميم العميل: قائمة صغيرة بجانب الترحيب، والقادمة مميّزة */
export default function PrayerCard() {
  const now = new Date();
  const next = nextPrayer(now).key;
  return (
    <aside className="pcardx" aria-label="مواقيت الصلاة في بريدة">
      <div className="pcardx-h"><b>مواقيت الصلاة</b><small>بريدة · {hijriDate(now)}</small></div>
      <dl>
        {prayerTimes(now).filter((p) => p.key !== "sunrise").map((p) => (
          <div key={p.key} className={p.key === next ? "next" : ""}>
            <dt>{p.name}</dt><dd className="tabular">{p.time.replace(/ [صم]$/, "")}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
