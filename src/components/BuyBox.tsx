"use client";
import { useState } from "react";
import Riyal from "@/components/Riyal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart";
import { sar } from "@/lib/money";

export type Variant = { id: number; name_ar: string; extra_price: string | number; in_stock: boolean };

/**
 * صندوق الشراء: الخيار ثم الكمية ثم الإضافة. الخيار يغيّر السعر فعلاً
 * (فرق المقاس في الأقمشة والعيار في الذهب ليس تفصيلاً).
 */
export default function BuyBox({
  base, variants, variantLabel, inStock,
}: {
  base: Omit<CartItem, "qty" | "variantId" | "variantName">;
  variants: Variant[];
  variantLabel: string | null;
  inStock: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [vid, setVid] = useState<number | null>(variants.find((v) => v.in_stock)?.id ?? null);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  const chosen = variants.find((v) => v.id === vid) ?? null;
  const price = base.price + (chosen ? Number(chosen.extra_price) : 0);
  const blocked = !inStock || (variants.length > 0 && !chosen);

  const onAdd = () => {
    if (blocked) return;
    add({ ...base, price, variantId: chosen?.id ?? null, variantName: chosen?.name_ar ?? null }, qty);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  // «اشترِ الآن» (نون/أمازون): أغلب طلبات المحلات المحلية قطعة واحدة — طريق أقصر من السلة
  const onBuyNow = () => {
    if (blocked) return;
    add({ ...base, price, variantId: chosen?.id ?? null, variantName: chosen?.name_ar ?? null }, qty);
    router.push("/checkout");
  };

  return (
    <div className="buybox">
      {variants.length > 0 && (
        <div className="variants">
          <span className="vlabel">{variantLabel || "الخيار"}</span>
          <div className="vlist">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!v.in_stock}
                className={`vchip${v.id === vid ? " on" : ""}${v.in_stock ? "" : " out"}`}
                onClick={() => setVid(v.id)}
              >
                {v.name_ar}
                {Number(v.extra_price) !== 0 && (
                  <small className="tabular">
                    {Number(v.extra_price) > 0 ? "+" : "−"}{sar(Math.abs(Number(v.extra_price)))}
                  </small>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="big-price buy-price">
        <b>{sar(price)}</b><span className="cur"><Riyal /></span>
        {base.unit && <span className="unit">{base.unit}</span>}
        <span className="vat">شامل ضريبة القيمة المضافة</span>
      </div>

      <div className="buy-row">
        <div className="qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="أنقص">−</button>
          <span className="tabular">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="زد">+</button>
        </div>
        <button type="button" className={`btn ${done ? "added" : "btn-gold"}`} onClick={onAdd} disabled={blocked}>
          {blocked ? "غير متوفّر حالياً" : done ? "أُضيف إلى السلة ✓" : "أضف إلى السلة"}
        </button>
        {!blocked && !done && <button type="button" className="btn btn-brand" onClick={onBuyNow}>اشترِ الآن</button>}
        {done && <Link href="/cart" className="btn btn-line">إتمام الطلب</Link>}
      </div>
    </div>
  );
}
