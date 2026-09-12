"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const I = {
  home: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />,
  stores: <><path d="M3 10 5 4h14l2 6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v9h14v-9" /></>,
  orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
  cart: <><path d="M3 4h2l2.5 11h11L21 7H6" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
};
const Icon = ({ k }: { k: keyof typeof I }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[k]}</svg>
);

/**
 * شريط سفلي ثابت على الجوال كما في حراج: خمسة أزرار، والأوسط هو الفعل الأساسي.
 * في حراج «أضف عرض»؛ عندنا «اطلب ما لا تجده» لأن الزبون لا يبيع بل يطلب.
 */
export default function BottomNav({ directory = false }: { directory?: boolean }) {
  const path = usePathname();
  const { count } = useCart();
  if (path.startsWith("/admin") || path.startsWith("/merchant")) return null;
  const on = (h: string) => (h === "/" ? path === "/" : path.startsWith(h)) ? " on" : "";
  if (directory) return (
    <nav className="bnav" aria-label="تنقّل سريع">
      <Link href="/" className={`bnav-i${on("/")}`}><Icon k="home" /><span>الرئيسية</span></Link>
      <Link href="/stores" className={`bnav-i${on("/stores")}`}><Icon k="stores" /><span>الماركات</span></Link>
      <Link href="/advertise" className="bnav-cta"><b>+</b><span>أعلن معنا</span></Link>
      <Link href="/merchant" className={`bnav-i${on("/merchant")}`}><Icon k="orders" /><span>المعلنون</span></Link>
      <Link href="/search" className={`bnav-i${on("/search")}`}><Icon k="search" /><span>بحث</span></Link>
    </nav>
  );
  return (
    <nav className="bnav" aria-label="تنقّل سريع">
      <Link href="/" className={`bnav-i${on("/")}`}><Icon k="home" /><span>الرئيسية</span></Link>
      <Link href="/stores" className={`bnav-i${on("/stores")}`}><Icon k="stores" /><span>المحلات</span></Link>
      <Link href="/requests" className="bnav-cta"><b>+</b><span>اطلب ما لا تجده</span></Link>
      <Link href="/orders" className={`bnav-i${on("/orders")}`}><Icon k="orders" /><span>طلباتي</span></Link>
      <Link href="/cart" className={`bnav-i${on("/cart")}`}>
        <span className="bnav-ico"><Icon k="cart" />{count > 0 && <i className="tabular">{count}</i>}</span><span>السلة</span>
      </Link>
    </nav>
  );
}
