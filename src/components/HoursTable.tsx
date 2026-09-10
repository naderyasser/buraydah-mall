"use client";
import { useEffect, useState } from "react";
import { DAY_NAMES, formatDay, riyadhNow } from "@/lib/hours";
import type { DayHours } from "@/lib/types";

export default function HoursTable({ hours }: { hours: DayHours[] }) {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(riyadhNow().day), []);

  if (!hours || hours.length !== 7) {
    return <p style={{ color: "var(--text-3)", fontSize: 14 }}>الدوام غير مسجّل بعد.</p>;
  }
  return (
    <dl style={{ margin: 0 }}>
      {DAY_NAMES.map((name, i) => (
        <div className={`kv${today === i ? " today" : ""}`} key={name}>
          <dt>{name}{today === i ? " · اليوم" : ""}</dt>
          <dd className="tabular">{formatDay(hours[i])}</dd>
        </div>
      ))}
    </dl>
  );
}
