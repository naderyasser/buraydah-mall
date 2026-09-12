import Link from "next/link";
import Riyal from "@/components/Riyal";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { requireStore } from "@/lib/merchant-auth";
import { merchantSetItemStatus } from "../../actions";
import OrderTimeline from "@/components/OrderTimeline";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلبات محلي", robots: { index: false } };

const LABEL: Record<string, string> = {
  new: "قيد المراجعة", confirmed: "أكّدته", ready: "جاهز / في الطريق", done: "سلّمته", cancelled: "ملغى",
};

export default async function MerchantOrders() {
  const store = await requireStore();
  const rows = await q<any>(
    `SELECT o.id, o.code, o.customer_name, o.phone, o.district, o.fulfilment,
            o.note, o.pickup_code, o.created_at,
            max(oi.status) AS status,
            sum(oi.qty)::int AS qty, sum(oi.price * oi.qty) AS value,
            string_agg(oi.name_ar || coalesce(' — ' || oi.variant_name, '') || ' ×' || oi.qty, ' · ') AS lines
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE oi.store_id = $1
     GROUP BY o.id
     ORDER BY (max(oi.status) = 'new') DESC, o.created_at DESC LIMIT 120`,
    [store.id]
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>طلبات محلك ({rows.length})</h2>
        <span>ترى نصيبك من الطلب فقط — بقيّة المحلات تدير نصيبها</span>
      </div>

      {rows.length === 0 && <div className="empty"><h3>لا طلبات بعد.</h3></div>}

      {rows.map((o: any) => (
        <article className="order-card" key={o.id}>
          <header>
            <div className="ohead">
              <span className="tabular ocode">{o.code}</span>
              <span className={`badge st-${o.status}`}>{LABEL[o.status]}</span>
              <span className="hint tabular">{new Date(o.created_at).toLocaleDateString("ar-SA-u-nu-latn")}</span>
            </div>
            <div className="tabular ototal">{sar(o.value)} <Riyal /></div>
          </header>

          <div className="ocust">
            <span>{o.customer_name}</span>
            <a className="tabular" dir="ltr" href={`tel:${o.phone}`}>{o.phone}</a>
            <span>{o.fulfilment === "delivery" ? `توصيل${o.district ? " — " + o.district : ""}` : "استلام من المحل"}</span>
            <span>رمز الاستلام: <b className="tabular">{o.pickup_code}</b></span>
            {o.note && <span className="hint">«{o.note}»</span>}
          </div>

          <div className="oparts">
            <div className="opart">
              <div className="opart-main">
                <b>{o.qty} قطعة</b>
                <span className="hint">{o.lines}</span>
                <OrderTimeline status={o.status} />
              </div>
              {/* زرّ واحد كبير للخطوة التالية (تطبيق سلة للتاجر) بدل قائمة منسدلة وحفظ */}
              <div className="opart-form">
                {o.status === "new" && (
                  <>
                    <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="confirmed" />
                      <button className="btn btn-brand">أكّد الطلب</button></form>
                    <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="cancelled" />
                      <button className="btn btn-line btn-sm">تعذّر التنفيذ</button></form>
                  </>
                )}
                {o.status === "confirmed" && (
                  <>
                    <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="ready" />
                      <button className="btn btn-brand">{o.fulfilment === "delivery" ? "خرج للتوصيل" : "جاهز للاستلام"}</button></form>
                    <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="done" />
                      <button className="btn btn-gold btn-sm">تم التسليم</button></form>
                    <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="cancelled" />
                      <button className="btn btn-line btn-sm">إلغاء</button></form>
                  </>
                )}
                {o.status === "ready" && (
                  <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="done" />
                    <button className="btn btn-gold">تم التسليم</button></form>
                )}
                {o.status === "done" && <span className="badge st-done">مكتمل</span>}
                {o.status === "cancelled" && (
                  <form action={merchantSetItemStatus}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="status" value="new" />
                    <button className="btn btn-line btn-sm">إرجاع إلى جديد</button></form>
                )}
              </div>
            </div>
          </div>

          <footer>
            <a className="btn btn-palm btn-sm"
               href={`https://wa.me/${o.phone.replace(/[^0-9]/g, "").replace(/^0/, "966")}?text=${encodeURIComponent(`مرحباً ${o.customer_name}، بخصوص طلبك رقم ${o.code} من مول بريدة`)}`}
               target="_blank" rel="noopener">تواصل مع العميل واتساب</a>
          </footer>
        </article>
      ))}
    </div>
  );
}
