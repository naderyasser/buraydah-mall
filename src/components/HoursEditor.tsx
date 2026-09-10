"use client";
import { useState } from "react";
import { DAY_NAMES } from "@/lib/hours";
import type { DayHours } from "@/lib/types";

const EMPTY: DayHours[] = Array.from({ length: 7 }, (_, i) => ({
  closed: i === 5, // الجمعة مغلق افتراضاً — عرف السوق المحلي
  am: i === 5 ? null : ["09:00", "12:30"],
  pm: i === 5 ? null : ["16:00", "22:00"],
}));

export default function HoursEditor({ initial }: { initial?: DayHours[] }) {
  const [days, setDays] = useState<DayHours[]>(
    initial && initial.length === 7 ? initial : EMPTY
  );

  const patch = (i: number, next: Partial<DayHours>) =>
    setDays((d) => d.map((x, j) => (j === i ? { ...x, ...next } : x)));

  const setSpan = (i: number, key: "am" | "pm", idx: 0 | 1, value: string) =>
    patch(i, {
      [key]: (() => {
        const cur = days[i][key] ?? ["", ""];
        const next: [string, string] = [cur[0], cur[1]];
        next[idx] = value;
        return next[0] && next[1] ? next : next;
      })(),
    } as Partial<DayHours>);

  return (
    <>
      <input type="hidden" name="hours" value={JSON.stringify(days)} />
      <div className="hours-editor">
        {DAY_NAMES.map((name, i) => (
          <div className="hours-row" key={name}>
            <span>{name}</span>
            <label className="chk" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={days[i].closed}
                onChange={(e) => patch(i, { closed: e.target.checked })}
              />
              مغلق
            </label>
            {!days[i].closed && (
              <div className="times">
                <input type="time" value={days[i].am?.[0] ?? ""} onChange={(e) => setSpan(i, "am", 0, e.target.value)} />
                <span>–</span>
                <input type="time" value={days[i].am?.[1] ?? ""} onChange={(e) => setSpan(i, "am", 1, e.target.value)} />
                <span style={{ color: "var(--text-3)" }}>و</span>
                <input type="time" value={days[i].pm?.[0] ?? ""} onChange={(e) => setSpan(i, "pm", 0, e.target.value)} />
                <span>–</span>
                <input type="time" value={days[i].pm?.[1] ?? ""} onChange={(e) => setSpan(i, "pm", 1, e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="hint">الفترة المسائية اختيارية — اتركها فارغة لو المحل يفتح فترة واحدة.</p>
    </>
  );
}
