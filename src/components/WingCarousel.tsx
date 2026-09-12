import Link from "next/link";

/**
 * شريط عرض بالسحب (scroll-snap) بلا JavaScript: شريحة لكل قسم بصورته وعدد محلاته.
 * الأسهم روابط إلى معرّف الشريحة — تعمل بلا سكربت وتُحترم من قارئات الشاشة.
 */
export default function WingCarousel({ wings }: { wings: any[] }) {
  const slides = wings.filter((w) => w.cover);
  if (slides.length === 0) return null;
  return (
    <div className="carousel" role="region" aria-label="أقسام المول">
      <div className="car-track">
        {slides.map((w, i) => (
          <Link href={`/wing/${w.slug}`} className="car-slide" id={`slide-${i}`} key={w.slug}
            style={{ backgroundImage: `url(${w.cover})` }}>
            <span className="car-txt">
              <b>{w.name_ar}</b>
              {w.tagline && <span>{w.tagline}</span>}
              <small className="tabular">{w.brand_count} محلاً{w.selling_count > 0 ? ` · ${w.selling_count} تبيع أونلاين` : ""}</small>
            </span>
          </Link>
        ))}
      </div>
      <div className="car-dots">
        {slides.map((w, i) => <a href={`#slide-${i}`} key={w.slug} aria-label={w.name_ar} />)}
      </div>
    </div>
  );
}
