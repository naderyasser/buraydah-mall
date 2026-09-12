import { q } from "@/db";
import { requireStore } from "@/lib/merchant-auth";
import { merchantAnswerQuestion } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "أسئلة العملاء", robots: { index: false } };

export default async function MerchantQuestions() {
  const store = await requireStore();
  const rows = await q<any>(
    `SELECT qq.*, p.name_ar AS product, p.slug FROM questions qq
     JOIN products p ON p.id = qq.product_id
     WHERE qq.store_id = $1 AND qq.status <> 'rejected'
     ORDER BY (qq.answer IS NULL) DESC, qq.created_at DESC LIMIT 100`,
    [store.id]
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>أسئلة عن منتجاتك ({rows.length})</h2>
        <span>جوابك يُنشر تحت المنتج ويقرأه كل زائر</span>
      </div>

      {rows.length === 0 && <div className="empty"><h3>لا أسئلة بعد.</h3></div>}

      <div className="qa-list">
        {rows.map((r: any) => (
          <div className="qa" key={r.id}>
            <p className="hint">على: {r.product}</p>
            <p className="q"><b>س:</b> {r.body}</p>
            {r.answer ? <p className="a"><b>ج:</b> {r.answer}</p> : (
              <form action={merchantAnswerQuestion} className="opart-form" style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={r.id} />
                <input name="answer" placeholder="اكتب الجواب…" style={{ flex: 1, padding: "8px 11px",
                  border: "1px solid var(--line-2)", borderRadius: "var(--r-sm)", font: "inherit" }} />
                <button className="btn btn-line btn-sm">انشر الجواب</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
