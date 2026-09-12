import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { q } from "@/db";
import Stars from "@/components/Stars";
import { setReviewStatus, setQuestionStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "التقييمات والأسئلة" };

export default async function ReviewsAdmin() {
  await requireAdmin();
  const [reviews, questions] = await Promise.all([
    q<any>(
      `SELECT r.*, s.name_ar AS store, p.name_ar AS product FROM reviews r
       JOIN stores s ON s.id = r.store_id
       LEFT JOIN products p ON p.id = r.product_id
       ORDER BY (r.status = 'pending') DESC, r.created_at DESC LIMIT 100`
    ),
    q<any>(
      `SELECT qq.*, s.name_ar AS store, p.name_ar AS product FROM questions qq
       JOIN stores s ON s.id = qq.store_id JOIN products p ON p.id = qq.product_id
       ORDER BY (qq.status = 'pending') DESC, qq.created_at DESC LIMIT 100`
    ),
  ]);

  const ST: Record<string, string> = { pending: "بانتظار المراجعة", published: "منشور", rejected: "مرفوض" };

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>التقييمات ({reviews.length})</h2>
        <span>لا يُنشر تقييم قبل المراجعة — ولا يُحذف بعدها</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>المنتج</th><th>التقييم</th><th>النص</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {reviews.map((r: any) => (
              <tr key={r.id}>
                <td>{r.store}</td>
                <td>{r.product ?? "—"}</td>
                <td><Stars value={r.rating} /></td>
                <td style={{ maxWidth: 320 }}>
                  {r.body}
                  {r.reply && <><br /><span className="hint">ردّ المحل: {r.reply}</span></>}
                </td>
                <td>{ST[r.status]}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {r.status !== "published" && (
                      <form action={setReviewStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="published" />
                        <button className="btn btn-line btn-sm">انشر</button>
                      </form>
                    )}
                    {r.status !== "rejected" && (
                      <form action={setReviewStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="btn btn-line btn-sm">ارفض</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && <tr><td colSpan={6}>لا تقييمات بعد.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="section-head" style={{ marginTop: 34 }}>
        <h2>أسئلة المنتجات ({questions.length})</h2>
        <span>تُنشر تلقائياً عند إجابة التاجر</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>المنتج</th><th>السؤال</th><th>الجواب</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {questions.map((r: any) => (
              <tr key={r.id}>
                <td>{r.store}</td>
                <td>{r.product}</td>
                <td style={{ maxWidth: 260 }}>{r.body}</td>
                <td style={{ maxWidth: 260 }}>{r.answer ?? <span className="hint">بلا جواب</span>}</td>
                <td>{ST[r.status]}</td>
                <td>
                  {r.status !== "published" ? (
                    <form action={setQuestionStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="published" />
                      <button className="btn btn-line btn-sm">انشر</button>
                    </form>
                  ) : (
                    <form action={setQuestionStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <button className="btn btn-line btn-sm">أخفِ</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {questions.length === 0 && <tr><td colSpan={6}>لا أسئلة بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
