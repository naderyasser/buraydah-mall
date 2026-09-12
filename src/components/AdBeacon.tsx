"use client";
import { useEffect } from "react";

/** يسجّل ظهور الحجوزات من المتصفّح مرّة لكل صفحة — الزواحف لا تنفّذ JS فلا تُحسب */
export default function AdBeacon({ ids }: { ids: number[] }) {
  useEffect(() => {
    if (ids.length === 0) return;
    try {
      const body = JSON.stringify({ ids });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/ad-impression", new Blob([body], { type: "application/json" }));
      else fetch("/api/ad-impression", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    } catch {}
  }, [ids.join(",")]);
  return null;
}
