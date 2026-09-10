"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart";

/**
 * زر البطاقة. المنتج ذو الخيارات لا يُضاف من البطاقة — يُفتح ليختار
 * المقاس أو العيار، وإلا وصل للمحل طلب بلا خيار.
 */
export default function AddToCart({
  item, label = "أضف للسلة", hasVariants = false, inStock = true,
}: { item: Omit<CartItem, "qty">; label?: string; hasVariants?: boolean; inStock?: boolean }) {
  const { add } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);

  if (!inStock) {
    return <button type="button" className="btn btn-line btn-sm btn-block" disabled>غير متوفّر</button>;
  }

  const onClick = () => {
    if (hasVariants) { router.push(`/product/${item.slug}`); return; }
    add(item, 1);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  return (
    <button type="button" onClick={onClick} className={`btn ${done ? "added" : "btn-gold"} btn-sm btn-block`}>
      {done ? "أُضيف ✓" : hasVariants ? "اختر الخيار" : label}
    </button>
  );
}
