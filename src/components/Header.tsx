"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import SearchBox from "./SearchBox";

/** ترويسة على طريقة حراج: شعار، بحث، وزرّ واحد — كل ما عداه في الشريط السفلي على الجوال */
export default function Header({ trending = [], directory = false }: { trending?: string[]; directory?: boolean }) {
  const { count } = useCart();
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="مول بريدة — الرئيسية">
          <img src="/logo.png" alt="مول بريدة" className="brand-logo" width={150} height={50} />
        </Link>
        <SearchBox trending={trending} />
        <div className="top-actions">
          {directory ? (
            <>
              <Link href="/stores" className="icon-btn ghost">دليل الماركات</Link>
              <Link href="/favorites" className="icon-btn ghost">المفضلة</Link>
              <Link href="/advertise" className="icon-btn adv-btn">أعلن معنا</Link>
            </>
          ) : (
            <>
              <Link href="/orders" className="icon-btn ghost">طلباتي</Link>
              <Link href="/stores" className="icon-btn ghost">الأقسام والمحلات</Link>
              <Link href="/favorites" className="icon-btn ghost">المفضلة</Link>
              <Link href="/cart" className="icon-btn cart-btn">
                السلة
                {count > 0 && <span className="count tabular">{count}</span>}
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="sadu" aria-hidden="true" />
    </header>
  );
}
