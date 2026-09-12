"use client";
import { useActionState } from "react";
import PhoneField from "@/components/PhoneField";
import { postBuyRequest } from "./actions";
import type { Wing } from "@/lib/types";

export default function RequestForm({ wings }: { wings: Wing[] }) {
  const [state, action, pending] = useActionState(postBuyRequest, null as any);

  if (state?.ok) {
    return (
      <aside className="panel req-form">
        <p className="ok-note" style={{ margin: 0 }}>{state.message}</p>
        <p className="hint" style={{ marginTop: 10 }}>
          العروض تصلك على جوالك من المحلات مباشرة. طلبك يبقى مفتوحاً ٣٠ يوماً.
        </p>
      </aside>
    );
  }

  return (
    <aside>
      <form action={action} className="panel form req-form">
        <h3 style={{ fontSize: 16 }}>اكتب طلبك</h3>
        <label>ما الذي تبحث عنه؟<input name="title" required placeholder="طقم زواج ذهب عيار 21" /></label>
        <label>تفاصيل<textarea name="body" rows={3} placeholder="الوزن، المقاس، اللون، الوقت المطلوب…" /></label>
        <div className="form-grid">
          <label>
            القسم
            <select name="wing_id" defaultValue="">
              <option value="">— اختر —</option>
              {wings.map((w) => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </label>
          <label>ميزانيتك (ر.س)<input name="budget_max" type="number" min={0} step="10" dir="ltr" /></label>
        </div>
        <div className="form-grid">
          <label>اسمك<input name="customer_name" required /></label>
          <label>جوالك<PhoneField /></label>
        </div>
        <label>الحي<input name="district" placeholder="الصفراء، الخبيب…" /></label>
        {state && !state.ok && <p className="error">{state.message}</p>}
        <button className="btn btn-gold" disabled={pending}>{pending ? "جارٍ النشر…" : "انشر طلبي"}</button>
        <p className="hint">
          رقمك يصل المحلات المعنيّة فقط ولا يظهر في الصفحة، وتُحجب الأرقام والروابط
          من نص الطلب حمايةً لك.
        </p>
      </form>
    </aside>
  );
}
