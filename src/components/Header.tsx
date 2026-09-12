"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import SearchBox from "./SearchBox";

export default function Header({ trending = [] }: { trending?: string[] }) {
  const { count } = useCart();
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="brand-mark">م</span>
          مول بريدة
        </Link>
        <SearchBox trending={trending} />
        <div className="top-actions">
          <Link href="/requests" className="icon-btn ghost">اطلب ما لا تجده</Link>
          <Link href="/orders" className="icon-btn ghost">طلباتي</Link>
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
