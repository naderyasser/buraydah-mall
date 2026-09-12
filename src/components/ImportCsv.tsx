"use client";
import { useActionState } from "react";

type R = { inserted: number; skipped: number; errors: string[] } | null;

/** استيراد منتجات بالجملة من CSV — الإدارة تختار المحل، والتاجر يستورد لمحله */
export default function ImportCsv({ action, stores }: {
  action: (prev: R, form: FormData) => Promise<R>;
  stores?: { id: number; name_ar: string }[];
}) {
  const [res, act, pending] = useActionState(action, null as R);
  return (
    <details className="panel" style={{ padding: 16, marginBottom: 16 }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>استيراد منتجات من إكسل (CSV)</summary>
      <form action={act} className="form" style={{ marginTop: 12 }}>
        <p className="hint" style={{ margin: 0 }}>
          نزّل <a href="/products-template.csv" download>القالب</a>، عبّئه في إكسل، واحفظه «CSV UTF-8». الأعمدة: الاسم، السعر،
          السعر قبل الخصم، الوحدة، التصنيف، الوسوم، الوصف، متوفر، الخيار، الخيارات (مثال: <span dir="ltr">54:0;56:0;58:20</span>).
          الاسم المكرّر في نفس المحل يُتخطّى ولا يُعدَّل.
        </p>
        <div className="form-grid">
          {stores && (
            <label>المحل<select name="store_id" required>{stores.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}</select></label>
          )}
          <label>الملف<input type="file" name="file" accept=".csv,text/csv" required /></label>
        </div>
        <button className="btn btn-brand" disabled={pending}>{pending ? "جارٍ الاستيراد…" : "استورد"}</button>
        {res && (
          <div className={res.inserted > 0 ? "ok-note" : "error"} style={{ marginTop: 10 }}>
            أُدرج <b className="tabular">{res.inserted}</b> · تُخطّي <b className="tabular">{res.skipped}</b>
            {res.errors.length > 0 && <ul style={{ margin: "6px 0 0", paddingInlineStart: 18 }}>{res.errors.slice(0, 15).map((e, i) => <li key={i}>{e}</li>)}</ul>}
          </div>
        )}
      </form>
    </details>
  );
}
