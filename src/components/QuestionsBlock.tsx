"use client";
import { useActionState, useState } from "react";
import { askQuestion } from "@/app/actions";

type Q = { id: number; author_name: string; body: string; answer: string | null; created_at: string };

/** أسئلة الزوار: تصنع محتوى وتكشف المحل الذي لا يردّ */
export default function QuestionsBlock({
  questions, productId, storeId,
}: { questions: Q[]; productId: number; storeId: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(askQuestion, null as any);

  return (
    <section className="section">
      <div className="section-head">
        <h2>أسئلة عن المنتج {questions.length ? <span className="tabular">({questions.length})</span> : null}</h2>
        {!open && !state?.ok && (
          <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(true)}>اسأل المحل</button>
        )}
      </div>

      {open && !state?.ok && (
        <form action={action} className="panel form">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="store_id" value={storeId} />
          <label>اسمك (اختياري)<input name="author_name" placeholder="زائر" /></label>
          <label>سؤالك<textarea name="body" rows={3} required placeholder="مثال: هل يتوفّر بمقاس أكبر؟" /></label>
          {state && !state.ok && <p className="error">{state.message}</p>}
          <button className="btn btn-brand" disabled={pending}>{pending ? "جارٍ الإرسال…" : "أرسل السؤال"}</button>
        </form>
      )}

      {state?.ok && <p className="ok-note">{state.message}</p>}

      <div className="qa-list">
        {questions.map((qq) => (
          <div className="qa" key={qq.id}>
            <p className="q"><b>س:</b> {qq.body}</p>
            {qq.answer ? <p className="a"><b>ج:</b> {qq.answer}</p>
                       : <p className="hint">بانتظار ردّ المحل</p>}
          </div>
        ))}
        {questions.length === 0 && !open && <p className="hint">لا أسئلة بعد — كن أول من يسأل.</p>}
      </div>
    </section>
  );
}
