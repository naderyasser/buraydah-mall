import type { DayHours } from "./types";

export const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** الوقت الحالي بتوقيت الرياض بصيغة {day:0-6, minutes} */
export function riyadhNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: map[get("weekday")] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function isOpenNow(hours: DayHours[], now = new Date()): boolean | null {
  if (!hours || hours.length !== 7) return null;
  const { day, minutes } = riyadhNow(now);
  const d = hours[day];
  if (!d || d.closed) return false;
  for (const span of [d.am, d.pm]) {
    if (!span) continue;
    const [from, to] = [toMin(span[0]), toMin(span[1])];
    // فترة تمتد بعد منتصف الليل (شائع في محلات الذهب)
    if (to < from ? minutes >= from || minutes < to : minutes >= from && minutes < to) return true;
  }
  return false;
}

export function formatDay(d: DayHours): string {
  if (d.closed) return "مغلق";
  const spans = [d.am, d.pm].filter(Boolean) as [string, string][];
  if (!spans.length) return "—";
  return spans.map(([a, b]) => `${a} – ${b}`).join("  و  ");
}
