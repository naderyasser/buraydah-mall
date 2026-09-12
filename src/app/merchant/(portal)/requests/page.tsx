import { q } from "@/db";
import Riyal from "@/components/Riyal";
import { sar } from "@/lib/money";
import { agoAr } from "@/lib/time";
import { requireStore } from "@/lib/merchant-auth";
import { merchantMakeOffer } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلبات الشراء", robots: { index: false } };

export default async function MerchantRequests() {
  const store = await requireStore();
  const rows = await q<any>(
    `SELECT r.id, r.title, r.body, r.budget_max, r.district, r.created_at,
            r.customer_name, r.phone, w.name_ar AS wing,
            o.price AS my_price, o.note AS my_note,
            (SELECT count(*)::int FROM buy_offers x WHERE x.request_id = r.id) AS offers
     FROM buy_requests r
     LEFT JOIN wings w ON w.id = r.wing_id
     LEFT JOIN buy_offers o ON o.request_id = r.id AND o.store_id = $1
     WHERE r.status = 'open' AND r.expires_on >= current_date
       AND (r.wing_id IS NULL OR r.wing_id = $2)
     ORDER BY (o.id IS NULL) DESC, r.created_at DESC LIMIT 60`,
    [store.id, store.wing_id]
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>طلبات الشراء ({rows.length})</h2>
        <span>زبائن يبحثون عن بضاعة في قسمك — اعرض عليهم مباشرة</span>
      </div>

      {rows.length === 0 && (
        <div className="empty">
          <h3>لا طلبات في قسمك الآن</h3>
          <p>تُعرض هنا طلبات الزبائن في «{store.name_ar}» وقسمه.</p>
        </div>
      )}

      {rows.map((r: any) => (
        <article className="order-card" key={r.id}>
          <header>
            <div className="ohead">
              <b>{r.title}</b>
              {r.budget_max && <span className="badge gold tabular">حتى {sar(r.budget_max)} <Riyal /></span>}
              <span className="hint">{agoAr(r.created_at)}</span>
            </div>
            <div className="hint tabular">{r.offers} عرضاً</div>
          </header>

          {r.body && <div className="ocust"><span>{r.body}</span></div>}

          <div className="ocust">
            <span>{r.customer_name}</span>
            {/* الرقم يظهر للتاجر فقط، لا في الصفحة العامة */}
            <a className="tabular" dir="ltr" href={`tel:${r.phone}`}>{r.phone}</a>
            {r.district && <span>حي {r.district}</span>}
            {r.wing && <span>{r.wing}</span>}
          </div>

          <footer>
            {r.my_price != null || r.my_note ? (
              <p className="ok-note" style={{ margin: 0 }}>
                عرضك مرسل: {r.my_price != null ? `${sar(r.my_price)} ر.س` : ""} {r.my_note ?? ""}
              </p>
            ) : null}
            <form action={merchantMakeOffer} className="opart-form" style={{ marginTop: 8, flexWrap: "wrap" }}>
              <input type="hidden" name="request_id" value={r.id} />
              <input name="price" type="number" min={0} step="1" dir="ltr" placeholder="سعرك (ر.س)"
                     style={{ width: 130, padding: "8px 11px", border: "1px solid var(--line-2)",
                              borderRadius: "var(--r-sm)", font: "inherit" }} />
              <input name="note" placeholder="تفاصيل عرضك — بلا أرقام تواصل"
                     style={{ flex: 1, minWidth: 200, padding: "8px 11px",
                              border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", font: "inherit" }} />
              <button className="btn btn-brand btn-sm">{r.my_price != null ? "حدّث عرضي" : "أرسل عرضي"}</button>
            </form>
          </footer>
        </article>
      ))}
    </div>
  );
}
