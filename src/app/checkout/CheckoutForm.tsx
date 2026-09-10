"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { sar } from "@/lib/money";
import { placeOrder } from "./actions";
import { checkCoupon } from "./coupon";

export default function CheckoutForm() {
  const { items, total, count, byStore, clear, removeMany, ready } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, null as any);
  const [coupon, couponAction, couponPending] = useActionState(checkCoupon, null as any);
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");

  useEffect(() => {
    if (state?.ok && state.token) {
      clear();
      router.push(`/order/${state.token}`);
    }
  }, [state, clear, router]);

  if (!ready) return <div className="wrap" style={{ padding: "48px 0" }} />;

  if (count === 0 && !state?.ok) {
    return (
      <div className="wrap" style={{ paddingTop: 34 }}>
        <div className="empty">
          <h3>لا يوجد ما يُطلب</h3>
          <p>أضف منتجات إلى سلتك أولاً.</p>
          <Link href="/" className="btn btn-gold" style={{ marginTop: 14 }}>تصفّح المول</Link>
        </div>
      </div>
    );
  }

  const groups = byStore();
  const discount = coupon?.ok
    ? coupon.kind === "percent" ? Math.round(total * coupon.value) / 100 : Math.min(coupon.value, total)
    : 0;

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/cart">السلة</Link> ‹ إتمام الطلب</nav>
      <div className="checkout-grid">
        <form action={action} className="form">
          <input
            type="hidden" name="items"
            value={JSON.stringify(items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null, qty: i.qty })))}
          />
          {coupon?.ok && <input type="hidden" name="coupon" value={coupon.code} />}

          <h1 style={{ fontSize: 28, marginBottom: 2 }}>بياناتك</h1>
          <p style={{ color: "var(--mut)", margin: 0 }}>
            لا نطلب بطاقة ولا حساباً — اسم ورقم جوال فقط، ونتصل بك للتأكيد.
          </p>

          <div className="form-grid">
            <label>الاسم<input name="customer_name" required autoComplete="name" /></label>
            <label>
              رقم الجوال
              <input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" autoComplete="tel" />
            </label>
          </div>

          <div>
            <span style={{ fontSize: 13.5, color: "var(--mut)" }}>طريقة الاستلام</span>
            <div className="radio-row" style={{ marginTop: 8 }}>
              <label className="radio-card">
                <input type="radio" name="fulfilment" value="pickup" defaultChecked
                       onChange={() => setMode("pickup")} />
                <span>الاستلام من المحل<small>مجاناً — تمرّ على المحل برمز الاستلام</small></span>
              </label>
              <label className="radio-card">
                <input type="radio" name="fulfilment" value="delivery" onChange={() => setMode("delivery")} />
                <span>توصيل داخل بريدة<small>رسوم كل محل تظهر في التأكيد</small></span>
              </label>
            </div>
          </div>

          <label>
            الحي {mode === "delivery" ? "(مطلوب للتوصيل)" : "(اختياري)"}
            <input name="district" required={mode === "delivery"} placeholder="الصفراء، الخبيب…" />
          </label>
          <label>ملاحظات<textarea name="note" rows={3} placeholder="مقاس، لون، وقت مناسب للاتصال…" /></label>

          {state && !state.ok && (
            <div className="error-box">
              <p className="error">{state.message}</p>
              {state.unavailable?.length > 0 && (
                <button type="button" className="btn btn-line btn-sm"
                        onClick={() => removeMany(state.unavailable)}>
                  احذف غير المتوفّر من السلة
                </button>
              )}
            </div>
          )}

          <button className="btn btn-gold" type="submit" disabled={pending}>
            {pending ? "جارٍ إرسال الطلب…" : "أرسل الطلب"}
          </button>
          <p className="hint">
            بإرسال الطلب توافق على تواصل المحلات معك على هذا الرقم. الدفع عند الاستلام،
            ولك حق الاسترجاع خلال ٧ أيام وفق <Link href="/returns">سياسة الاستبدال والاسترجاع</Link>.
          </p>
        </form>

        <aside className="totals">
          <h4 style={{ fontSize: 15, marginBottom: 10 }}>
            طلبك موزّع على {groups.length} {groups.length === 1 ? "محل" : "محلات"}
          </h4>
          {groups.map((g) => (
            <div key={g.storeId} className="totals-store">
              <div className="line">
                <b>{g.storeName}</b>
                <span className="tabular">{sar(g.subtotal)}</span>
              </div>
              <div className="sub">
                {g.items.map((i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ""} ×${i.qty}`).join(" · ")}
              </div>
            </div>
          ))}

          <form action={couponAction} className="coupon-row">
            <input type="hidden" name="subtotal" value={total} />
            <input name="coupon" placeholder="رمز كوبون" dir="ltr" defaultValue={coupon?.ok ? coupon.code : ""} />
            <button className="btn btn-line btn-sm" disabled={couponPending}>
              {couponPending ? "…" : "تطبيق"}
            </button>
          </form>
          {coupon && (
            <p className={coupon.ok ? "ok-note sm" : "error sm"}>{coupon.message}</p>
          )}

          <div className="row"><span>المجموع</span><span className="tabular">{sar(total)} ر.س</span></div>
          {discount > 0 && (
            <div className="row discount"><span>الخصم</span><span className="tabular">− {sar(discount)} ر.س</span></div>
          )}
          <div className="row grand">
            <span>الإجمالي</span>
            <b className="tabular">{sar(total - discount)} ر.س</b>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            {mode === "delivery"
              ? "تُضاف رسوم توصيل كل محل عند التأكيد، وتسقط عمّن بلغت سلّته حدّ التوصيل المجاني."
              : "الاستلام من المحل مجاني."} الأسعار شاملة الضريبة.
          </p>
        </aside>
      </div>
    </div>
  );
}
