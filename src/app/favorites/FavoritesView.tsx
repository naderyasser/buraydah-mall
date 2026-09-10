"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { readFavs } from "@/components/Favorite";
import { loadFavorites } from "./actions";

export default function FavoritesView() {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    const load = () => loadFavorites(readFavs()).then(setItems).catch(() => setItems([]));
    load();
    window.addEventListener("mall:favs", load);
    return () => window.removeEventListener("mall:favs", load);
  }, []);

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ المفضلة</nav>
      <section className="section" style={{ paddingTop: 18 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,32px)" }}>المفضلة</h1>
        <p style={{ color: "var(--mut)" }}>محفوظة على جهازك — بلا حساب ولا تسجيل.</p>
      </section>

      {items === null ? null : items.length === 0 ? (
        <div className="empty">
          <h3>لا شيء في المفضلة بعد</h3>
          <p>اضغط ♡ على أي منتج ليُحفظ هنا.</p>
          <Link href="/" className="btn btn-gold" style={{ marginTop: 14 }}>ابدأ التصفّح</Link>
        </div>
      ) : (
        <div className="grid">{items.map((p) => <ProductCard p={p} key={p.id} />)}</div>
      )}
    </div>
  );
}
