"use client";
import { useEffect, useState } from "react";

/** عدّ تنازلي حيّ — يبدأ فارغاً ثم يتحدّث كل ثانية (بلا فرق ترطيب لأن الخادم لا يرسم أرقاماً) */
export default function Countdown({ to, label, boxes = false }: { to: string; label: string; boxes?: boolean }) {
  const calc = () => Math.max(0, new Date(to).getTime() - Date.now());
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => { setMs(calc()); const id = setInterval(() => setMs(calc()), boxes ? 1000 : 60_000); return () => clearInterval(id); }, [to, boxes]);
  if (ms === null) return <div className={boxes ? "cd-boxes" : "countdown"} aria-label={label} />;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  const parts: [number, string][] = boxes ? [[d, "أيام"], [h, "ساعات"], [m, "دقائق"], [s, "ثوانٍ"]] : [[d, "يوم"], [h, "ساعة"], [m, "دقيقة"]];
  return (
    <div className={boxes ? "cd-boxes" : "countdown"} aria-label={label} role="timer">
      {parts.map(([n, l]) => (
        <span key={l}><b className="tabular">{String(n).padStart(2, "0")}</b><small>{l}</small></span>
      ))}
    </div>
  );
}
