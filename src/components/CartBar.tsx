"use client";
import Link from "next/link";
import Riyal from "@/components/Riyal";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { sar } from "@/lib/money";

/** شريط سفلي على الجوال — يذكّر بالسلة دون أن يقاطع التصفّح */
export default function CartBar() {
  const { count, total } = useCart();
  const path = usePathname();
  if (count === 0) return null;
  if (path === "/cart" || path === "/checkout" || path.startsWith("/order/") || path.startsWith("/admin")) return null;
  return (
    <div className="cartbar">
      <span className="sum">
        <b className="tabular">{count}</b> قطعة · <b className="tabular">{sar(total)}</b> <Riyal />
      </span>
      <Link href="/cart" className="btn btn-gold btn-sm">مراجعة السلة</Link>
    </div>
  );
}
