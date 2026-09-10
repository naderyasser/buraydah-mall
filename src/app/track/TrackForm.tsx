"use client";
import Link from "next/link";
import { useActionState } from "react";
import { sar } from "@/lib/money";
import { trackOrder } from "./actions";
import OrderTimeline from "@/components/OrderTimeline";

export default function TrackForm() {
  const [state, action, pending] = useActionState(trackOrder, null as any);

  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ تتبّع الطلب</nav>

      <section className="section" style={{ paddingTop: 18 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,32px)" }}>تتبّع طلبك</h1>
        <p style={{ color: "var(--mut)" }}>
          اكتب رقم الطلب ورقم الجوال الذي طلبت به — الرقمان معاً حمايةً لبياناتك.
        </p>

        <form action={action} className="panel form">
          <div className="form-grid">
            <label>رقم الطلب<input name="code" required dir="ltr" placeholder="BRD-1003" /></label>
            <label>رقم الجوال<input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" /></label>
          </div>
          {state && !state.ok && <p className="error">{state.message}</p>}
          <button className="btn btn-gold" disabled={pending}>{pending ? "جارٍ البحث…" : "اعرض حالة الطلب"}</button>
        </form>
      </section>

      {state?.ok && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="order-card">
            <header>
              <div className="ohead">
                <span className="tabular ocode">{state.order.code}</span>
                <span className="hint tabular">
                  {new Date(state.order.created_at).toLocaleDateString("ar-SA-u-nu-latn")}
                </span>
              </div>
              <div className="tabular ototal">{sar(state.order.total)} ر.س</div>
            </header>

            <div className="pickup-code">
              رمز الاستلام: <b className="tabular">{state.order.pickup_code}</b>
              <small>اذكره للمحل عند الاستلام</small>
            </div>

            <div className="oparts">
              {state.parts.map((p: any, i: number) => (
                <div className="opart" key={i}>
                  <div className="opart-main">
                    <Link href={`/store/${p.slug}`}><b>{p.store}</b></Link>
                    <span className="hint">{p.lines}</span>
                    <OrderTimeline status={p.status} />
                  </div>
                  <span className="tabular opart-val">{sar(p.value)} ر.س</span>
                </div>
              ))}
            </div>
          </div>

          <p className="hint" style={{ marginTop: 12 }}>
            {state.order.fulfilment === "delivery"
              ? "طلبك توصيل داخل بريدة — يتواصل معك كل محل على الجوال."
              : "طلبك استلام من المحل — مرّ عليه في دوامه واذكر رمز الاستلام."}
          </p>
        </section>
      )}
    </div>
  );
}
