"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { sar } from "@/lib/money";

const KEY = "mall_seen_v1";
export type Seen = { id: number; slug: string; name: string; price: number; image: string | null };

export function remember(p: Seen) {
  try {
    const cur: Seen[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [p, ...cur.filter((x) => x.id !== p.id)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* تجاهل */ }
}

/** «شاهدت مؤخراً» من الجهاز نفسه — بلا حساب وبلا تتبّع على الخادم */
export default function RecentlyViewed({ exclude }: { exclude?: number }) {
  const [items, setItems] = useState<Seen[]>([]);
  useEffect(() => {
    try {
      const cur: Seen[] = JSON.parse(localStorage.getItem(KEY) || "[]");
      setItems(cur.filter((x) => x.id !== exclude).slice(0, 8));
    } catch { /* تجاهل */ }
  }, [exclude]);

  if (items.length === 0) return null;
  return (
    <section className="section">
      <div className="section-head"><h2>شاهدت مؤخراً</h2></div>
      <div className="seen-row">
        {items.map((p) => (
          <Link href={`/product/${p.slug}`} key={p.id} className="seen">
            {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="ph" />}
            <b>{p.name}</b>
            <span className="tabular">{sar(p.price)} ر.س</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
