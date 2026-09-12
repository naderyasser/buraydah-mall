import { prayerTimes, nextPrayer } from "@/lib/saudi";

/** مواقيت بريدة اليوم في سطر واحد — المحلات تغلق وقت الصلاة، فالمشتري يخطّط زيارته حولها */
export default function PrayerRow() {
  const now = new Date();
  const next = nextPrayer(now).key;
  return (
    <p className="prayers" title="تقريبية بمعايير أم القرى — بريدة">
      <span className="prayers-h">مواقيت الصلاة في بريدة اليوم:</span>
      {prayerTimes(now).filter((p) => p.key !== "sunrise").map((p, i) => (
        <span key={p.key} className={`prayer${p.key === next ? " next" : ""}`}>
          {i > 0 && <span className="sep">·</span>}{p.name} <b className="tabular">{p.time}</b>
        </span>
      ))}
    </p>
  );
}
