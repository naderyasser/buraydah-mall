"use client";
import { useEffect, useState } from "react";

/** عدّ تنازلي بالأيام والساعات والدقائق — يبدأ بقيمة الخادم ثم يتحدّث كل دقيقة */
export default function Countdown({ to, label }: { to: string; label: string }) {
  const calc = () => Math.max(0, new Date(to).getTime() - Date.now());
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { setMs(calc()); const id = setInterval(() => setMs(calc()), 60_000); return () => clearInterval(id); }, [to]);
  if (ms === null) return <div className="countdown" aria-label={label} />;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return (
    <div className="countdown" aria-label={label}>
      <span><b className="tabular">{d}</b><small>يوم</small></span>
      <span><b className="tabular">{h}</b><small>ساعة</small></span>
      <span><b className="tabular">{m}</b><small>دقيقة</small></span>
    </div>
  );
}
