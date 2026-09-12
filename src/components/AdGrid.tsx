import Link from "next/link";
import type { Placement } from "@/lib/ads";
import { DEST_META } from "@/lib/destinations";
import AdBeacon from "./AdBeacon";

/**
 * شبكة المساحات الإعلانية — قلب المول الإعلاني: كاملة ثم نصفان ثم أربعة أرباع ثم
 * الخانات الصغيرة. كل مساحة تحوّل عبر /go/ (يسجّل النقرة على الحجز) لموقع الماركة.
 * الخانات الفارغة تُعرض «مساحة متاحة» للمعلنين — الفراغ نفسه إعلان للمول.
 */
const go = (p: Placement) => `/go/${p.slug}?ad=${p.id}`;
const ext = (p: Placement) => ({ target: "_blank", rel: "nofollow sponsored noopener" as const });

export default function AdGrid({ placements, counts, zoneLabel, compact = false }: {
  placements: Placement[]; counts: { size: string; total: number; taken: number }[]; zoneLabel: string; compact?: boolean;
}) {
  const by = (size: string) => placements.filter((p) => p.size === size);
  const free = (size: string) => { const c = counts.find((x) => x.size === size); return c ? c.total - c.taken : 0; };
  const full = by("full")[0], halves = by("half"), quarters = by("quarter"), smalls = by("small");
  const ids = placements.map((p) => p.id);
  const Empty = ({ size, cls }: { size: string; cls: string }) => (
    <Link href={`/advertise?size=${size}`} className={`ad-empty ${cls}`}>
      <span className="ad-empty-t">مساحة متاحة</span>
      <small>{ { full: "صفحة كاملة", half: "نصف صفحة", quarter: "ربع صفحة", small: "خانة" }[size] } — احجزها لماركتك</small>
    </Link>
  );
  return (
    <div className={`adgrid${compact ? " compact" : ""}`}>
      <AdBeacon ids={ids} />
      {/* صفحة كاملة */}
      {full ? (
        <a href={go(full)} {...ext(full)} className="ad-full" style={full.image_path || full.sample_images[0] ? { backgroundImage: `url(${full.image_path ?? full.sample_images[0]})` } : undefined}>
          <span className="ad-full-body">
            {full.logo_path && <img src={full.logo_path} alt={full.name_ar} className="ad-logo-lg" />}
            <b>{full.headline ?? full.name_ar}</b>
            {full.summary_ar && <p>{full.summary_ar}</p>}
            <span className="ad-cta">زيارة {DEST_META[full.dest_type as keyof typeof DEST_META]?.label ?? "الموقع"} ↗</span>
          </span>
          <span className="ad-tag">إعلان · {full.wing_name}</span>
        </a>
      ) : free("full") > 0 && !compact ? <Empty size="full" cls="ad-full" /> : null}

      {/* نصفان */}
      {(halves.length > 0 || free("half") > 0) && (
        <div className="ad-halves">
          {halves.map((p) => (
            <a key={p.id} href={go(p)} {...ext(p)} className="ad-half" style={p.image_path || p.sample_images[0] ? { backgroundImage: `url(${p.image_path ?? p.sample_images[0]})` } : undefined}>
              <span className="ad-half-body">
                {p.logo_path && <img src={p.logo_path} alt={p.name_ar} className="ad-logo" />}
                <b>{p.headline ?? p.name_ar}</b>
                {p.summary_ar && <small>{p.summary_ar}</small>}
              </span>
              <span className="ad-tag">إعلان</span>
            </a>
          ))}
          {!compact && Array.from({ length: Math.max(0, free("half")) }).map((_, i) => <Empty key={i} size="half" cls="ad-half" />)}
        </div>
      )}

      {/* أرباع */}
      {(quarters.length > 0 || free("quarter") > 0) && (
        <div className="ad-quarters">
          {quarters.map((p) => (
            <a key={p.id} href={go(p)} {...ext(p)} className="ad-quarter">
              <span className="ad-q-logo">{p.logo_path ? <img src={p.logo_path} alt={p.name_ar} /> : <b>{p.name_ar}</b>}</span>
              <span className="ad-q-body">
                <b>{p.name_ar}</b>
                <small>{p.headline ?? p.summary_ar ?? p.wing_name}</small>
                {p.sample_images.length > 0 && (
                  <span className="ad-samples">{p.sample_images.map((s, i) => <img key={i} src={s} alt="" loading="lazy" />)}</span>
                )}
                <span className="ad-link">زيارة الموقع ↗</span>
              </span>
            </a>
          ))}
          {!compact && Array.from({ length: Math.max(0, free("quarter")) }).map((_, i) => <Empty key={i} size="quarter" cls="ad-quarter" />)}
        </div>
      )}

      {/* الخانات الصغيرة */}
      {(smalls.length > 0 || free("small") > 0) && (
        <div className="ad-smalls">
          {smalls.map((p) => (
            <a key={p.id} href={go(p)} {...ext(p)} className="ad-small" title={p.name_ar}>
              <span className="ad-s-logo">{p.logo_path ? <img src={p.logo_path} alt={p.name_ar} loading="lazy" /> : <b>{p.name_ar}</b>}</span>
              <small>{p.name_ar}</small>
            </a>
          ))}
          {!compact && Array.from({ length: Math.min(6, Math.max(0, free("small"))) }).map((_, i) => (
            <Link key={i} href="/advertise?size=small" className="ad-small ad-small-empty"><span className="ad-s-logo">+</span><small>خانتك هنا</small></Link>
          ))}
        </div>
      )}
      <p className="ad-note">المساحات في {zoneLabel} إعلانات مدفوعة من أصحابها — الضغط ينقلك لموقع الماركة أو حسابها الرسمي. <Link href="/advertise">أعلن معنا</Link></p>
    </div>
  );
}
