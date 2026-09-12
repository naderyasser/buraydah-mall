"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import PhoneField from "@/components/PhoneField";
import { submitLead, type LeadResult } from "@/app/lead/actions";

export const LEADS_KEY = "mall_leads";

/**
 * «اطلب من الماركة» — الفعل الأساسي في المول الإعلاني: اسم وجوال وما يريده الزائر،
 * يُحفظ كطلب مقيس للماركة، ثم يكمل الزائر على واتساب الماركة برسالة جاهزة.
 */
export default function LeadForm({ storeId, storeName, productId, productName, placementId, compact = false, cta = "اطلب الآن" }: {
  storeId: number; storeName: string; productId?: number; productName?: string; placementId?: number; compact?: boolean; cta?: string;
}) {
  const [open, setOpen] = useState(!compact);
  const [state, action, pending] = useActionState(submitLead, null as LeadResult | null);
  const formRef = useRef<HTMLFormElement>(null);
  // بيانات آخر طلب تُعبَّأ في الحقول الفارغة فقط بعد التركيب — بلا إعادة تركيب ولا مسح لما كتبه الزائر
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("mall_customer") || "null"); const f = formRef.current; if (!v || !f) return;
      for (const [k, key] of [["customer_name", "name"], ["phone", "phone"], ["district", "district"]] as const) {
        const el = f.elements.namedItem(k) as HTMLInputElement | null; if (el && !el.value && v[key]) el.value = v[key];
      }
    } catch {}
  }, [open]);
  useEffect(() => {
    if (state?.ok) {
      try {
        const cur: any[] = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
        localStorage.setItem(LEADS_KEY, JSON.stringify([{ token: state.token, at: Date.now() }, ...cur.filter((x) => x.token !== state.token)].slice(0, 30)));
      } catch {}
    }
  }, [state]);

  if (state?.ok) {
    return (
      <div className="lead-done">
        <b>✓ {state.message}</b>
        <div className="buy-row" style={{ marginTop: 10 }}>
          {state.wa && <a className="btn btn-palm" href={state.wa} target="_blank" rel="noopener">متابعة على واتساب {state.storeName}</a>}
          {state.site && <a className="btn btn-line" href={state.site} target="_blank" rel="noopener nofollow">موقع الماركة ↗</a>}
        </div>
        <p className="hint">تجد طلباتك في <a href="/orders">طلباتي</a> على هذا الجهاز.</p>
      </div>
    );
  }
  if (compact && !open) return <button type="button" className="btn btn-gold" onClick={() => setOpen(true)}>{cta}</button>;
  return (
    <form ref={formRef} action={action} className="lead-form" onSubmit={(e) => {
      const f = e.currentTarget; try { localStorage.setItem("mall_customer", JSON.stringify({ name: (f.elements.namedItem("customer_name") as HTMLInputElement).value, phone: (f.elements.namedItem("phone") as HTMLInputElement).value, district: (f.elements.namedItem("district") as HTMLInputElement)?.value })); } catch {}
    }}>
      <input type="hidden" name="store_id" value={storeId} />
      {productId && <input type="hidden" name="product_id" value={productId} />}
      {placementId && <input type="hidden" name="placement_id" value={placementId} />}
      <input type="hidden" name="source" value={typeof location !== "undefined" ? location.pathname : ""} />
      <b className="lead-title">{productName ? `اطلب «${productName}» من ${storeName}` : `اطلب من ${storeName}`}</b>
      <div className="form-grid">
        <label>اسمك<input name="customer_name" required autoComplete="name" /></label>
        <label>جوالك<PhoneField /></label>
      </div>
      <div className="form-grid">
        <label>الحي (اختياري)<input name="district" list="buraydah-districts" autoComplete="off" placeholder="الصفراء، الخبيب…" /></label>
        <label>طلبك<textarea name="message" rows={2} placeholder={productName ? "المقاس، اللون، الكمية، أو أي تفصيل" : "ما الذي تريده من الماركة؟"} /></label>
      </div>
      {state && !state.ok && <p className="error">{state.message}</p>}
      <div className="buy-row">
        <button className="btn btn-gold" disabled={pending}>{pending ? "جارٍ الإرسال…" : cta}</button>
        {compact && <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>إلغاء</button>}
      </div>
      <p className="hint">يصل طلبك للماركة فوراً وتتواصل معك على جوالك — ثم تكمل الشراء معها مباشرة.</p>
    </form>
  );
}
