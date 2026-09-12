/**
 * تفاصيل سعودية محلية: التاريخ الهجري، مواقيت الصلاة في بريدة، المناسبات
 * الوطنية والدينية، أحياء بريدة، والتحية بتوقيت الرياض.
 * كلها حسابات محلية بلا خدمة خارجية — الموقع لا يعتمد على أحد ليعرف أن اليوم جمعة.
 */

export const RIYADH_TZ = "Asia/Riyadh";
/** إحداثيات بريدة (وسط المدينة) */
export const BURAYDAH = { lat: 26.3260, lng: 43.9750 };

/** «الجمعة ٢٠ ربيع الأول ١٤٤٨هـ» — تقويم أم القرى الذي تُكتب به كل الفواتير هنا */
export function hijriDate(d: Date = new Date(), opts: { weekday?: boolean } = {}): string {
  const s = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-arab", {
    timeZone: RIYADH_TZ, day: "numeric", month: "long", year: "numeric",
    ...(opts.weekday ? { weekday: "long" } : {}),
  }).format(d);
  return s.replace(/\s*هـ$/, "") + "هـ";
}

export function gregorianDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    timeZone: RIYADH_TZ, day: "numeric", month: "long", year: "numeric",
  }).format(d) + "م";
}

function hijriParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura-nu-latn", { timeZone: RIYADH_TZ, day: "numeric", month: "numeric", year: "numeric" })
    .formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { day: g("day"), month: g("month"), year: g("year") };
}
function riyadhParts(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: RIYADH_TZ, day: "numeric", month: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: false })
    .formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { day: g("day"), month: g("month"), year: g("year"), hour: g("hour") % 24, minute: g("minute") };
}

export type Occasion = { key: string; label: string; emoji: string; note: string; peak?: boolean };

/** المناسبة الجارية إن وُجدت — يُلوَّن بها الشريط ويُعنوَن بها قسم العروض */
export function currentOccasion(d: Date = new Date()): Occasion | null {
  const g = riyadhParts(d);
  const h = hijriParts(d);
  if (g.month === 9 && g.day >= 15 && g.day <= 24)
    return { key: "national", label: `اليوم الوطني ${g.year - 1930}`, emoji: "🇸🇦", note: "عروض المحلات بمناسبة اليوم الوطني — ٢٣ سبتمبر", peak: g.day === 23 };
  if (g.month === 2 && g.day >= 18 && g.day <= 23)
    return { key: "founding", label: "يوم التأسيس", emoji: "🌴", note: "يوم بدينا — ٢٢ فبراير", peak: g.day === 22 };
  if (g.month === 3 && g.day === 11)
    return { key: "flag", label: "يوم العلم", emoji: "🇸🇦", note: "١١ مارس", peak: true };
  if (h.month === 9)
    return { key: "ramadan", label: "رمضان كريم", emoji: "🌙", note: "مواعيد المحلات في رمضان تختلف — راجع دوام كل محل", peak: h.day === 1 };
  if (h.month === 10 && h.day <= 4)
    return { key: "fitr", label: "عيد الفطر المبارك", emoji: "🎉", note: "كل عام وأنتم بخير — بعض المحلات مغلقة أيام العيد", peak: h.day === 1 };
  if (h.month === 12 && h.day >= 8 && h.day <= 13)
    return { key: "adha", label: "عيد الأضحى المبارك", emoji: "🐑", note: "كل عام وأنتم بخير — بعض المحلات مغلقة أيام العيد", peak: h.day === 10 };
  return null;
}

/** نهاية نافذة المناسبة الجارية أو القادمة (آخر لحظة بتوقيت الرياض) — تُضبط بها عروض التجّار */
export function occasionEnd(d: Date = new Date()): { occ: Occasion; ends: Date } | null {
  let cur = currentOccasion(d) ?? upcomingOccasion(d);
  if (!cur) return null;
  // امشِ يوماً يوماً حتى يخرج التاريخ من النافذة
  let t = new Date(d.getTime());
  if (!currentOccasion(t)) t = new Date(t.getTime() + (upcomingOccasion(d)!.days) * 864e5);
  let last = t;
  for (let i = 0; i < 40; i++) {
    const n = new Date(t.getTime() + 864e5);
    if (currentOccasion(n)?.key !== cur.key) break;
    t = n; last = n;
  }
  const g = riyadhParts(last);
  const ends = new Date(`${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}T23:59:00+03:00`);
  return { occ: cur, ends };
}

/** أول يوم في نافذة المناسبة القادمة (منتصف ليل الرياض) — لعدّ تنازلي قبل بدء العروض */
export function occasionStart(d: Date = new Date()): Date | null {
  for (let i = 0; i <= 45; i++) {
    const t = new Date(d.getTime() + i * 864e5);
    if (currentOccasion(t)) {
      const g = riyadhParts(t);
      return new Date(`${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}T00:00:00+03:00`);
    }
  }
  return null;
}

/** كود الكوبون الموحّد لكل مناسبة — يُعرض في صفحة المناسبة ويصنعه المدير في الكوبونات */
export const OCCASION_COUPON: Record<string, string> = { national: "KSA96", founding: "FOUNDING", ramadan: "RAMADAN", fitr: "EID", adha: "EID" };
export const OCCASION_TAG = "اليوم الوطني";

/** أقرب يوم مناسبة (اليوم نفسه لا بداية حملته) خلال ٤٥ يوماً — «بعد ١١ يوماً: اليوم الوطني» */
export function upcomingOccasion(d: Date = new Date()): (Occasion & { days: number }) | null {
  for (let i = 1; i <= 45; i++) {
    const t = new Date(d.getTime() + i * 864e5);
    const o = currentOccasion(t);
    if (o?.peak) return { ...o, days: i };
  }
  return null;
}

/** تحية بتوقيت الرياض — «مساء الخير يا أهل بريدة» */
export function greeting(d: Date = new Date()): string {
  const h = riyadhParts(d).hour;
  if (h >= 4 && h < 12) return "صباح الخير يا أهل بريدة";
  if (h >= 12 && h < 17) return "حيّاكم الله يا أهل بريدة";
  return "مساء الخير يا أهل بريدة";
}

/* ── مواقيت الصلاة (حساب فلكي قياسي بمعايير أم القرى: الفجر ١٨.٥°، العشاء بعد المغرب بـ٩٠ دقيقة) ── */
const RAD = Math.PI / 180;
function sunTimes(date: Date, lat: number, lng: number) {
  // يوم جولياني عند منتصف نهار المكان
  const g = riyadhParts(date);
  const jd = Math.floor(367 * g.year - Math.floor(7 * (g.year + Math.floor((g.month + 9) / 12)) / 4) + Math.floor(275 * g.month / 9) + g.day + 1721013.5);
  const D = jd - 2451545.0;
  const gm = (357.529 + 0.98560028 * D) % 360;
  const qq = (280.459 + 0.98564736 * D) % 360;
  const L = (qq + 1.915 * Math.sin(gm * RAD) + 0.020 * Math.sin(2 * gm * RAD)) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA = (Math.atan2(Math.cos(e * RAD) * Math.sin(L * RAD), Math.cos(L * RAD)) / RAD / 15 + 24) % 24;
  const decl = Math.asin(Math.sin(e * RAD) * Math.sin(L * RAD)) / RAD;
  const eqt = qq / 15 - RA; // معادلة الزمن بالساعات
  const tz = 3; // توقيت الرياض ثابت بلا توقيت صيفي
  const noon = 12 + tz - lng / 15 - eqt;
  const hourAngle = (angle: number) => {
    const c = (-Math.sin(angle * RAD) - Math.sin(lat * RAD) * Math.sin(decl * RAD)) / (Math.cos(lat * RAD) * Math.cos(decl * RAD));
    return Math.acos(Math.max(-1, Math.min(1, c))) / RAD / 15;
  };
  const asrAngle = -Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl) * RAD))) / RAD; // ظل المثل (الجمهور)
  const fajr = noon - hourAngle(18.5);
  const sunrise = noon - hourAngle(0.833);
  const asr = noon + hourAngle(asrAngle);
  const maghrib = noon + hourAngle(0.833);
  const isha = maghrib + 1.5;
  return { fajr, sunrise, dhuhr: noon + 0.05, asr, maghrib, isha };
}

export type Prayer = { key: string; name: string; time: string; minutes: number };

export function prayerTimes(date: Date = new Date()): Prayer[] {
  const t = sunTimes(date, BURAYDAH.lat, BURAYDAH.lng);
  const names: [keyof typeof t, string][] = [["fajr", "الفجر"], ["sunrise", "الشروق"], ["dhuhr", "الظهر"], ["asr", "العصر"], ["maghrib", "المغرب"], ["isha", "العشاء"]];
  return names.map(([k, name]) => {
    const minutes = Math.round(t[k] * 60);
    const h = Math.floor(minutes / 60) % 24, m = minutes % 60;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { key: k, name, minutes, time: `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "ص" : "م"}` };
  });
}

/** الصلاة القادمة الآن بتوقيت بريدة — ما يعرضه الشريط العلوي */
export function nextPrayer(d: Date = new Date()): Prayer {
  const now = riyadhParts(d);
  const cur = now.hour * 60 + now.minute;
  const list = prayerTimes(d).filter((p) => p.key !== "sunrise");
  return list.find((p) => p.minutes > cur) ?? { ...list[0], name: "فجر الغد" };
}

/** أحياء بريدة كما يكتبها أهلها — للإكمال في نماذج العنوان والمحل */
export const BURAYDAH_DISTRICTS = [
  "الصفراء", "الخبيب", "النخيل", "الروضة", "الإسكان", "السلام", "الرحاب", "الشماس", "الصناعية", "الفايزية", "الموطأ",
  "سلطانة", "الريان", "الحمر", "الوسيطاء", "البصر", "الضاحي", "الأخضر", "خب البريدي", "الرابية", "الجردة", "الجامعيين",
  "الفاخرية", "النقع", "الحزم", "الزرقاء", "الصباخ", "القادسية", "المنتزه", "النهضة", "الوادي", "الوطن", "قرطبة", "الشقة",
  "الأفق", "الغدير", "الجنوب", "الشرق", "العريفية", "المطار", "الحيلان", "المريدسية", "الإفتاء", "الروابي", "الطويلة",
  "الملك فهد", "الهلال", "الخليج", "المروج", "الياسمين", "أشيقر", "الرمال", "المعيقلية", "غرب المدينة", "الجزيرة",
];
