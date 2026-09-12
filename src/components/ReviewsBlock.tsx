"use client";
import { useActionState, useState } from "react";
import PhoneField from "@/components/PhoneField";
import Stars from "./Stars";
import { submitReview } from "@/app/actions";

type Review = {
  id: number; author_name: string; rating: number; body: string | null;
  reply: string | null; created_at: string;
};

/**
 * التقييم لمن اشترى فعلاً، والمحل يردّ ولا يحذف — قاعدة تحمي الطرفين
 * في سوق صغير يعرف بعضه.
 */
export default function ReviewsBlock({
  reviews, storeId, productId, avg, count,
}: { reviews: Review[]; storeId: number; productId?: number; avg?: number | string | null; count?: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitReview, null as any);

  return (
    <section className="section reviews">
      <div className="section-head">
        <h2>التقييمات {count ? <span className="tabular">({count})</span> : null}</h2>
        {!open && !state?.ok && (
          <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(true)}>
            أضف تقييمك
          </button>
        )}
      </div>

      {avg ? (
        <div className="rating-summary">
          <b className="tabular">{Number(avg).toFixed(1)}</b>
          <Stars value={avg} size={18} />
          <span className="hint">من {count} تقييماً موثّقاً بطلب حقيقي</span>
        </div>
      ) : (
        <p className="hint">لا تقييمات بعد. أول من يطلب ويقيّم يفتح الباب لغيره.</p>
      )}

      {open && !state?.ok && (
        <form action={action} className="panel form review-form">
          <input type="hidden" name="store_id" value={storeId} />
          {productId && <input type="hidden" name="product_id" value={productId} />}
          <div className="form-grid">
            <label>اسمك<input name="author_name" required /></label>
            <label>
              جوالك (نفس رقم الطلب)
              <PhoneField />
            </label>
          </div>
          <label>
            تقييمك
            <select name="rating" defaultValue="5">
              <option value="5">٥ — ممتاز</option>
              <option value="4">٤ — جيد جداً</option>
              <option value="3">٣ — مقبول</option>
              <option value="2">٢ — ضعيف</option>
              <option value="1">١ — سيّئ</option>
            </select>
          </label>
          <label>رأيك<textarea name="body" rows={3} placeholder="ما الذي أعجبك أو لم يعجبك؟" /></label>
          {state && !state.ok && <p className="error">{state.message}</p>}
          <button className="btn btn-brand" disabled={pending}>{pending ? "جارٍ الإرسال…" : "أرسل التقييم"}</button>
          <p className="hint">التقييم يُنشر بعد المراجعة، ولا يُحذف بعد نشره — للمحل حق الردّ عليه.</p>
        </form>
      )}

      {state?.ok && <p className="ok-note">{state.message}</p>}

      <div className="review-list">
        {reviews.map((r) => (
          <article className="review" key={r.id}>
            <header>
              <b>{r.author_name}</b>
              <Stars value={r.rating} />
              <span className="hint tabular">
                {new Date(r.created_at).toLocaleDateString("ar-SA-u-nu-latn")}
              </span>
            </header>
            {r.body && <p>{r.body}</p>}
            {r.reply && <div className="reply"><b>ردّ المحل:</b> {r.reply}</div>}
          </article>
        ))}
      </div>
    </section>
  );
}
