import Link from "next/link";
import { notFound } from "next/navigation";
import { q, q1 } from "@/db";
import { sar } from "@/lib/money";
import { buildDestUrl } from "@/lib/destinations";
import type { OrderRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "تأكيد الطلب" };

type Item = {
  name_ar: string; price: string; qty: number;
  store_id: number; store_name: string; store_slug: string;
  dest_type: any; dest_value: string; whatsapp_text: string | null; phone: string | null;
};

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await q1<OrderRow>(`SELECT * FROM orders WHERE token = $1`, [token]);
  if (!order) notFound();

  const items = await q<Item>(
    `SELECT oi.name_ar, oi.price, oi.qty, oi.store_id,
            s.name_ar AS store_name, s.slug AS store_slug,
            s.dest_type, s.dest_value, s.whatsapp_text, s.phone
     FROM order_items oi JOIN stores s ON s.id = oi.store_id
     WHERE oi.order_id = $1 ORDER BY s.name_ar`,
    [order.id]
  );

  const groups = new Map<number, { name: string; slug: string; items: Item[]; subtotal: number; store: Item }>();
  for (const it of items) {
    const g = groups.get(it.store_id) ?? { name: it.store_name, slug: it.store_slug, items: [], subtotal: 0, store: it };
    g.items.push(it);
    g.subtotal += Number(it.price) * it.qty;
    groups.set(it.store_id, g);
  }

  return (
    <div className="wrap" style={{ maxWidth: 780 }}>
      <section className="section" style={{ paddingTop: 30 }}>
        <span className="badge open">تم استلام طلبك</span>
        <h1 style={{ fontSize: "clamp(26px,4.4vw,36px)", marginTop: 12 }}>
          طلبك رقم <span className="tabular">{order.code}</span>
        </h1>
        <p style={{ color: "var(--text-2)", maxWidth: "58ch" }}>
          سنتصل بك على <span className="tabular" dir="ltr">{order.phone}</span> للتأكيد.
          طلبك موزّع على {order.stores_count} {order.stores_count === 1 ? "محل" : "محلات"}،
          وكل محل يؤكّد نصيبه منه. الدفع عند الاستلام.
        </p>
      </section>

      {[...groups.values()].map((g) => {
        const lines = g.items.map((i) => `• ${i.name_ar} ×${i.qty}`).join("\n");
        const waText = `طلب من مول بريدة رقم ${order.code}\n${lines}\nالإجمالي: ${sar(g.subtotal)} ر.س\nالاسم: ${order.customer_name}`;
        const wa = g.store.phone
          ? `https://wa.me/${g.store.phone.replace(/[^\d]/g, "").replace(/^0/, "966")}?text=${encodeURIComponent(waText)}`
          : buildDestUrl(g.store as any);
        return (
          <div className="shop-group" key={g.slug}>
            <header>
              <Link href={`/store/${g.slug}`}>{g.name}</Link>
              <span className="badge gold tabular">{sar(g.subtotal)} ر.س</span>
            </header>
            <dl className="hours-list">
              {g.items.map((i, n) => (
                <div className="kv" key={n}>
                  <dt style={{ color: "var(--text)" }}>{i.name_ar} <span className="tabular">×{i.qty}</span></dt>
                  <dd className="tabular">{sar(Number(i.price) * i.qty)} ر.س</dd>
                </div>
              ))}
            </dl>
            <a className="btn btn-palm btn-sm" href={wa} target="_blank" rel="noopener" style={{ marginTop: 12 }}>
              أرسل الطلب للمحل عبر واتساب
            </a>
          </div>
        );
      })}

      <div className="totals" style={{ position: "static", marginTop: 6 }}>
        <div className="row"><span>عدد القطع</span><b className="tabular">{order.items_count}</b></div>
        <div className="row"><span>طريقة الاستلام</span><b>{order.fulfilment === "delivery" ? "توصيل داخل بريدة" : "استلام من المحل"}</b></div>
        <div className="row grand"><span>الإجمالي</span><b className="tabular">{sar(order.total)} ر.س</b></div>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link href="/" className="btn btn-line">عودة إلى المول</Link>
      </p>
    </div>
  );
}
