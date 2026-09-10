"use client";
import { useEffect } from "react";

/** يُسجَّل من المتصفّح لا من الخادم، فيستبعد أغلب الزواحف ويعطي رقماً صادقاً */
export default function VisitBeacon() {
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/visit", {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: location.pathname }),
      }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, []);
  return null;
}
