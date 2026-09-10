/** وقت نسبي عربي: «قبل ٢٥ دقيقة» — أرخص إشارة على أن السوق حيّ */
const AR = (n: number) => n.toLocaleString("ar-EG");

export function agoAr(when: string | Date): string {
  const t = typeof when === "string" ? new Date(when) : when;
  const s = Math.max(0, (Date.now() - t.getTime()) / 1000);
  if (s < 90) return "الآن";
  const m = Math.round(s / 60);
  if (m < 60) return `قبل ${AR(m)} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `قبل ${AR(h)} ساعة`;
  const d = Math.round(h / 24);
  if (d === 1) return "أمس";
  if (d === 2) return "أول أمس";
  if (d < 30) return `قبل ${AR(d)} أيام`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `قبل ${AR(mo)} شهر`;
  return `قبل ${AR(Math.round(mo / 12))} سنة`;
}
