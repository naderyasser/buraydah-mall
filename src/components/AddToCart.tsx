"use client";
import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart";

export default function AddToCart({
  item, label = "أضف للسلة", size = "sm", withQty = false,
}: { item: Omit<CartItem, "qty">; label?: string; size?: "sm" | "lg"; withQty?: boolean }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  const onAdd = () => {
    add(item, qty);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  return (
    <>
      {withQty && (
        <div className="qty">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="أنقص">−</button>
          <span className="tabular">{qty}</span>
          <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="زد">+</button>
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        className={`btn ${done ? "added" : "btn-gold"} ${size === "sm" ? "btn-sm btn-block" : ""}`}
      >
        {done ? "أُضيف ✓" : label}
      </button>
    </>
  );
}
