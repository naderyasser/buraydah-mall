import { q } from "@/db";
import { requireStore } from "@/lib/merchant-auth";
import { agoAr } from "@/lib/time";
import { waNumber } from "@/lib/settings";
import { merchantSetLeadStatus } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات الواردة", robots: { index: false } };
const ST: Record<string, string> = { new: "جديد", contacted: "تمّ التواصل", done: "تمّ البيع", spam: "مزعج" };

/** زرّ حالة = نموذج مستقلّ بحقل مخفي — قيمة زرّ الإرسال لا تصل إلى server action بثبات */
function Act({ id, status, cls, label }: { id: number; status: string; cls: string; label: string }) {
  return (
    <form action={merchantSetLeadStatus}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
      <button className={cls}>{label}</button>
    </form>
  );
}

/** صندوق طلبات المعلن — قلب القيمة التي يدفع لأجلها: طلبات بأسماء وأرقام لا نقرات مجهولة */
export default async function MerchantLeads() {
  const store = await requireStore();
  const rows = await q<any>(
    `SELECT l.id, l.customer_name, l.phone, l.district, l.message, l.status, l.source, l.created_at::text AS created_at,
            p.name_ar AS product, p.slug AS product_slug
     FROM leads l LEFT JOIN products p ON p.id = l.product_id
     WHERE l.store_id = $1 ORDER BY (l.status = 'new') DESC, l.created_at DESC LIMIT 200`, [store.id]);
  const fresh = rows.filter((r: any) => r.status === "new").length;
  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>الطلبات الواردة ({rows.length})</h2>
        <span>{fresh > 0 ? `${fresh} طلباً ينتظر ردّك — الردّ في أول ساعة يضاعف الإتمام` : "لا طلبات جديدة"}</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty"><h3>لا طلبات بعد</h3><p>كل زائر يضغط «اطلب» في صفحتك أو على منتج من عيّناتك يصلك هنا فوراً باسمه وجواله.</p></div>
      ) : (
        <div className="leads">
          {rows.map((r: any) => (
            <div className={`lead-card${r.status === "new" ? " fresh" : ""}`} key={r.id}>
              <div className="lead-head">
                <b>{r.customer_name}</b>
                <a className="tabular" dir="ltr" href={`https://wa.me/${waNumber("0" + r.phone)}?text=${encodeURIComponent(`مرحباً ${r.customer_name}، بخصوص طلبك من ${store.name_ar} عبر مول بريدة`)}`} target="_blank" rel="noopener">0{r.phone} واتساب ↗</a>
                <a className="tabular" dir="ltr" href={`tel:0${r.phone}`}>اتصال</a>
                <span className="hint">{agoAr(r.created_at)}{r.district ? ` · حي ${r.district}` : ""}</span>
                <span className={`badge st-${r.status === "new" ? "new" : r.status === "contacted" ? "confirmed" : r.status === "done" ? "done" : "cancelled"}`}>{ST[r.status]}</span>
              </div>
              {r.product && <div className="hint">المنتج: {r.product}</div>}
              {r.message && <p className="lead-msg">«{r.message}»</p>}
              <div className="opart-form">
                {r.status === "new" && <Act id={r.id} status="contacted" cls="btn btn-brand btn-sm" label="تواصلت معه" />}
                {r.status !== "done" && r.status !== "spam" && <Act id={r.id} status="done" cls="btn btn-gold btn-sm" label="تمّ البيع" />}
                {r.status !== "spam" && <Act id={r.id} status="spam" cls="btn btn-line btn-sm" label="مزعج" />}
                {r.status === "spam" && <Act id={r.id} status="new" cls="btn btn-line btn-sm" label="إرجاع" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
