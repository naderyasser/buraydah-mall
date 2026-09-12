import Link from "next/link";
import Riyal from "@/components/Riyal";
import { requireAdmin } from "@/lib/auth";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { setOrderStatus, setOrderItemStatus, markRefusal } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات" };

const LABEL: Record<string, string> = { new: "جديد", confirmed: "مؤكَّد", ready: "جاهز / في الطريق", done: "مكتمل", cancelled: "ملغى" };

type Part = {
  order_id: number; store_id: number; store: string; slug: string;
  status: string; qty: number; value: string; lines: string;
};

export default async function OrdersAdmin() {
  await requireAdmin();
  const orders = await q<any>(
    `SELECT o.* FROM orders o ORDER BY (o.status = 'new') DESC, o.created_at DESC LIMIT 120`
  );

  // نصيب كل محل من كل طلب — الوحدة التي يؤكّدها التاجر فعلاً
  const parts = orders.length
    ? await q<Part>(
        `SELECT oi.order_id, oi.store_id, s.name_ar AS store, s.slug, oi.status,
                sum(oi.qty)::int AS qty, sum(oi.price * oi.qty) AS value,
                string_agg(oi.name_ar || ' ×' || oi.qty, ' · ') AS lines
         FROM order_items oi JOIN stores s ON s.id = oi.store_id
         WHERE oi.order_id = ANY($1)
         GROUP BY oi.order_id, oi.store_id, s.name_ar, s.slug, oi.status
         ORDER BY s.name_ar`,
        [orders.map((o: any) => o.id)]
      )
    : [];

  const byOrder = new Map<number, Part[]>();
  for (const p of parts) byOrder.set(p.order_id, [...(byOrder.get(p.order_id) ?? []), p]);

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>الطلبات ({orders.length})</h2>
        <span>كل محل يؤكّد نصيبه وحده — وحالة الطلب محصّلة ما أكّده الجميع</span>
      </div>

      {orders.length === 0 && <div className="empty"><h3>لا توجد طلبات بعد.</h3></div>}

      {orders.map((o: any) => (
        <article className="order-card" key={o.id}>
          <header>
            <div className="ohead">
              <Link href={`/order/${o.token}`} className="tabular ocode">{o.code}</Link>
              <span className={`badge st-${o.status}`}>{LABEL[o.status]}</span>
              <span className="hint tabular">
                {new Date(o.created_at).toLocaleDateString("ar-SA-u-nu-latn")}
              </span>
            </div>
            <div className="tabular ototal">{sar(o.total)} <Riyal /></div>
          </header>

          <div className="ocust">
            <span>{o.customer_name}</span>
            <a className="tabular" dir="ltr" href={`tel:${o.phone}`}>{o.phone}</a>
            <span>{o.fulfilment === "delivery" ? `توصيل${o.district ? " — " + o.district : ""}` : "استلام من المحل"}</span>
            {o.note && <span className="hint">«{o.note}»</span>}
          </div>

          <div className="oparts">
            {(byOrder.get(o.id) ?? []).map((p) => (
              <div className="opart" key={`${o.id}-${p.store_id}-${p.status}`}>
                <div className="opart-main">
                  <Link href={`/store/${p.slug}`}><b>{p.store}</b></Link>
                  <span className="hint">{p.lines}</span>
                </div>
                <span className="tabular opart-val">{sar(p.value)} <Riyal /></span>
                <form action={setOrderItemStatus} className="opart-form">
                  <input type="hidden" name="order_id" value={o.id} />
                  <input type="hidden" name="store_id" value={p.store_id} />
                  <select name="status" defaultValue={p.status}>
                    {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button className="btn btn-line btn-sm">حفظ</button>
                </form>
              </div>
            ))}
          </div>

          <footer style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <form action={setOrderStatus} className="opart-form">
              <input type="hidden" name="id" value={o.id} />
              <span className="hint">أو غيّر الطلب كله:</span>
              <select name="status" defaultValue={o.status}>
                {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button className="btn btn-line btn-sm">تطبيق على كل المحلات</button>
            </form>

            {!o.refused && o.status !== "cancelled" && (
              <form action={markRefusal} className="opart-form">
                <input type="hidden" name="order_id" value={o.id} />
                <button className="btn btn-line btn-sm">سجّل رفض الاستلام</button>
              </form>
            )}
            {o.refused && <span className="badge st-cancelled">رفض الاستلام</span>}
            {o.cancelled_by === "customer" && <span className="badge st-cancelled">ألغاه العميل</span>}
          </footer>
        </article>
      ))}
    </div>
  );
}
