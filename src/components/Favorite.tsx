"use client";
import { useEffect, useState } from "react";

const KEY = "mall_fav_v1";

export function readFavs(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

/** المفضّلة على الجهاز: لا حساب ولا تسجيل — أقل احتكاك ممكن */
export default function Favorite({ id, size = "sm" }: { id: number; size?: "sm" | "lg" }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { setOn(readFavs().includes(id)); setReady(true); }, [id]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = readFavs();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* تجاهل */ }
    setOn(next.includes(id));
    window.dispatchEvent(new CustomEvent("mall:favs", { detail: next }));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`fav ${size}${on ? " on" : ""}`}
      aria-label={on ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      aria-pressed={on}
      style={{ visibility: ready ? "visible" : "hidden" }}
    >
      {on ? "♥" : "♡"}
    </button>
  );
}
