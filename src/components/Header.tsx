"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import SearchBox from "./SearchBox";
import BrandMark from "./BrandMark";

/** ترويسة على طريقة حراج: شعار، بحث، وزرّ واحد — كل ما عداه في الشريط السفلي على الجوال */
export default function Header({ trending = [] }: { trending?: string[] }) {
  const { count } = useCart();
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="مول بريدة — الرئيسية">
          <BrandMark />
          <span className="brand-txt">مول بريدة</span>
        </Link>
        <SearchBox trending={trending} />
        <div className="top-actions">
          <Link href="/orders" className="icon-btn ghost">طلباتي</Link>
          <Link href="/favorites" className="icon-btn ghost">المفضلة</Link>
          <Link href="/join" className="icon-btn ghost">انضم كتاجر</Link>
          <Link href="/cart" className="icon-btn cart-btn">
            السلة
            {count > 0 && <span className="count tabular">{count}</span>}
          </Link>
        </div>
      </div>
      <div className="sadu" aria-hidden="true" />
    </header>
  );
}
