"use client";
import { useActionState } from "react";
import { notifyWhenBack } from "@/app/actions";

/** «أعلمني عند التوفّر» — يحوّل منتجاً نافداً إلى قائمة طلب حقيقية */
export default function StockAlert({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState(notifyWhenBack, null as any);
  if (state?.ok) return <p className="ok-note">{state.message}</p>;

  return (
    <form action={action} className="stock-alert">
      <input type="hidden" name="product_id" value={productId} />
      <span>نفد من المحل — سجّل رقمك ونبلّغك أول ما يرجع:</span>
      <div className="sa-row">
        <input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" />
        <button className="btn btn-line" disabled={pending}>{pending ? "…" : "أعلمني"}</button>
      </div>
      {state && !state.ok && <p className="error">{state.message}</p>}
    </form>
  );
}
