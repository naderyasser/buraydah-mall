"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { count } = useCart();
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="brand-mark">م</span>
          مول بريدة
        </Link>
        <form className="hsearch" action="/search">
          <input name="q" placeholder="ابحث عن منتج أو محل…" aria-label="بحث" />
          <button type="submit">بحث</button>
        </form>
        <div className="top-actions">
          <Link href="/requests" className="icon-btn ghost">اطلب ما لا تجده</Link>
          <Link href="/track" className="icon-btn ghost">تتبّع طلبك</Link>
          <Link href="/favorites" className="icon-btn ghost">المفضلة</Link>
          <Link href="/join" className="icon-btn">انضم كتاجر</Link>
          <Link href="/cart" className="icon-btn">
            السلة
            {count > 0 && <span className="count tabular">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
