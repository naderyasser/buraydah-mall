import { q } from "@/db";
import Stars from "@/components/Stars";
import { requireStore } from "@/lib/merchant-auth";
import { merchantReplyReview } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "تقييمات محلي", robots: { index: false } };

export default async function MerchantReviews() {
  const store = await requireStore();
  const rows = await q<any>(
    `SELECT r.*, p.name_ar AS product FROM reviews r
     LEFT JOIN products p ON p.id = r.product_id
     WHERE r.store_id = $1 AND r.status = 'published'
     ORDER BY (r.reply IS NULL) DESC, r.created_at DESC LIMIT 100`,
    [store.id]
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>تقييمات عملائك ({rows.length})</h2>
        <span>التقييم لا يُحذف — لك أن تردّ عليه</span>
      </div>

      {rows.length === 0 && <div className="empty"><h3>لا تقييمات بعد.</h3></div>}

      <div className="review-list">
        {rows.map((r: any) => (
          <article className="review" key={r.id}>
            <header>
              <b>{r.author_name}</b>
              <Stars value={r.rating} />
              {r.product && <span className="hint">على: {r.product}</span>}
              <span className="hint tabular">{new Date(r.created_at).toLocaleDateString("ar-SA-u-nu-latn")}</span>
            </header>
            {r.body && <p>{r.body}</p>}
            {r.reply ? (
              <div className="reply"><b>ردّك:</b> {r.reply}</div>
            ) : (
              <form action={merchantReplyReview} className="opart-form" style={{ marginTop: 10 }}>
                <input type="hidden" name="id" value={r.id} />
                <input name="reply" placeholder="اكتب ردّك على العميل…" style={{ flex: 1, padding: "8px 11px",
                  border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", font: "inherit" }} />
                <button className="btn btn-line btn-sm">أرسل الردّ</button>
              </form>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
