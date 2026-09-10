import { headers } from "next/headers";

/**
 * تحديد معدّل في الذاكرة. عملية Node واحدة تخدم الموقع كله، فالعدّاد في
 * الذاكرة صادق — ويُعاد صفراً عند إعادة التشغيل، وهذا مقبول: الغرض إيقاف
 * الرشّ الآلي على النماذج العامة لا صدّ هجوم موزّع.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// تنظيف دوري كي لا تتضخّم الخريطة على خادم يعمل شهوراً
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for") ?? "";
  return (fwd.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

/** يعيد true إذا تجاوز الحدّ — النداء يُرفض بلطف لا بخطأ تقني */
export async function tooMany(action: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  sweep(now);
  const key = `${action}:${await clientKey()}`;
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > limit;
}

export const RATE = {
  order:   { limit: 5,  windowMs: 10 * 60_000, msg: "طلبات كثيرة في وقت قصير. انتظر قليلاً ثم أعد المحاولة." },
  review:  { limit: 5,  windowMs: 60 * 60_000, msg: "أرسلت تقييمات كثيرة. جرّب بعد ساعة." },
  form:    { limit: 8,  windowMs: 30 * 60_000, msg: "محاولات كثيرة. انتظر قليلاً ثم أعد الإرسال." },
  login:   { limit: 10, windowMs: 15 * 60_000, msg: "محاولات دخول كثيرة. انتظر ربع ساعة." },
} as const;
