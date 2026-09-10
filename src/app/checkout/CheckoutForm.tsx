"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { sar } from "@/lib/money";
import { placeOrder } from "./actions";

export default function CheckoutForm() {
  const { items, total, count, byStore, clear, ready } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, null as any);

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

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/cart">السلة</Link> ‹ إتمام الطلب</nav>
      <div className="checkout-grid">
        <form action={action} className="form">
          <input
            type="hidden" name="items"
            value={JSON.stringify(items.map((i) => ({ productId: i.productId, qty: i.qty })))}
          />
          <h1 style={{ fontSize: 28, marginBottom: 2 }}>بياناتك</h1>
          <p style={{ color: "var(--text-2)", margin: 0 }}>
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
            <span style={{ fontSize: 13.5, color: "var(--text-2)" }}>طريقة الاستلام</span>
            <div className="radio-row" style={{ marginTop: 8 }}>
              <label className="radio-card">
                <input type="radio" name="fulfilment" value="pickup" defaultChecked />
                <span>الاستلام من المحل<small>تمرّ على كل محل وتستلم طلبك</small></span>
              </label>
              <label className="radio-card">
                <input type="radio" name="fulfilment" value="delivery" />
                <span>توصيل داخل بريدة<small>يُتفق على الأجرة مع المحل</small></span>
              </label>
            </div>
          </div>

          <label>الحي (للتوصيل)<input name="district" placeholder="الصفراء، الخبيب…" /></label>
          <label>ملاحظات<textarea name="note" rows={3} placeholder="مقاس، لون، وقت مناسب للاتصال…" /></label>

          {state && !state.ok && <p className="error">{state.message}</p>}

          <button className="btn btn-gold" type="submit" disabled={pending}>
            {pending ? "جارٍ إرسال الطلب…" : "أرسل الطلب"}
          </button>
          <p className="hint">
            بإرسال الطلب توافق على تواصل المحلات معك على هذا الرقم. الدفع عند الاستلام.
          </p>
        </form>

        <aside className="totals">
          <h4 style={{ fontSize: 15, marginBottom: 10 }}>طلبك موزّع على {groups.length} {groups.length === 1 ? "محل" : "محلات"}</h4>
          {groups.map((g) => (
            <div key={g.storeId} style={{ padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14.5 }}>
                <b style={{ fontFamily: "var(--f-display, inherit)" }}>{g.storeName}</b>
                <span className="tabular">{sar(g.subtotal)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                {g.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")}
              </div>
            </div>
          ))}
          <div className="row grand"><span>الإجمالي</span><b className="tabular">{sar(total)} ر.س</b></div>
        </aside>
      </div>
    </div>
  );
}
