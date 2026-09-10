"use client";
import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/hours";
import type { DayHours } from "@/lib/types";

/** يُحسب في المتصفّح كي تبقى الصفحات ثابتة وسريعة رغم تغيّر الوقت */
export default function OpenNow({ hours }: { hours: DayHours[] }) {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => setState(isOpenNow(hours)), [hours]);
  if (state === null) return null;
  return (
    <span className={`badge ${state ? "open" : "closed"}`}>
      {state ? "مفتوح الآن" : "مغلق الآن"}
    </span>
  );
}
