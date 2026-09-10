import { riyadhNow } from "./hours";
import type { DayHours } from "./types";

/**
 * وعد الجاهزية بصيغة جرير: رقم وساعة قطع لا وعد مطّاط.
 * يُحسب من دوام المحل نفسه — إن كان مفتوحاً الآن فالوعد اليوم، وإلا فغداً.
 */
export function readyPromise(
  hours: DayHours[] | null,
  readyMinutes: number,
  now = new Date()
): string {
  const mins = Math.max(15, readyMinutes || 60);
  const human = mins >= 120 ? `${Math.round(mins / 60)} ساعات`
              : mins >= 60  ? "ساعة واحدة"
              : `${mins} دقيقة`;

  if (!hours || hours.length !== 7) return `جاهز للاستلام خلال ${human} من تأكيد المحل.`;

  const { day, minutes } = riyadhNow(now);
  const today = hours[day];
  const spans = today && !today.closed
    ? ([today.am, today.pm].filter(Boolean) as [string, string][])
    : [];
  const toMin = (t: string) => Number(t.split(":")[0]) * 60 + Number(t.split(":")[1] || 0);
  const lastClose = spans.length ? Math.max(...spans.map((s) => toMin(s[1]))) : null;

  if (lastClose != null && minutes + mins <= lastClose) {
    const cut = `${String(Math.floor((lastClose - mins) / 60)).padStart(2, "0")}:${String((lastClose - mins) % 60).padStart(2, "0")}`;
    return `جاهز للاستلام خلال ${human} إذا أكّد المحل قبل ${cut}.`;
  }
  return `جاهز للاستلام خلال ${human} من فتح المحل في دوامه القادم.`;
}

export function holdNote(days: number): string {
  const d = Math.max(1, days || 3);
  return `يُحتفظ بطلبك ${d === 1 ? "يوماً واحداً" : d === 2 ? "يومين" : `${d} أيام`} من إشعار الجاهزية.`;
}
