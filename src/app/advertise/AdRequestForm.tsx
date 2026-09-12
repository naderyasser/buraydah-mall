"use client";
import { useActionState } from "react";
import PhoneField from "@/components/PhoneField";
import { submitAdRequest } from "./actions";

export default function AdRequestForm({ sizes, wings, defaultSize }: {
  sizes: { key: string; name: string }[]; wings: { slug: string; name_ar: string }[]; defaultSize?: string;
}) {
  const [state, action, pending] = useActionState(submitAdRequest, null as null | { ok: boolean; message: string });
  if (state?.ok) return <div className="panel" style={{ borderColor: "var(--brand)" }}><p style={{ margin: 0, color: "var(--brand-d)", fontWeight: 700 }}>{state.message}</p></div>;
  return (
    <form action={action} className="panel form">
      <div className="form-grid">
        <label>اسم الماركة / المتجر *<input name="brand_name" required /></label>
        <label>اسم المسؤول<input name="contact_name" /></label>
      </div>
      <div className="form-grid">
        <label>رقم الجوال *<PhoneField /></label>
        <label>موقعك أو حسابك الرسمي<input name="website" dir="ltr" placeholder="https://… أو @instagram" /></label>
      </div>
      <div className="form-grid">
        <label>المساحة المطلوبة
          <select name="size" defaultValue={defaultSize && sizes.some((s) => s.key === defaultSize) ? defaultSize : "quarter"}>
            {sizes.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
          </select>
        </label>
        <label>المدّة
          <select name="months" defaultValue="3">
            {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m === 1 ? "شهر" : m === 3 ? "٣ أشهر" : m === 6 ? "٦ أشهر" : "سنة"}</option>)}
          </select>
        </label>
        <label>القطاع
          <select name="wing_slug" defaultValue="">
            <option value="">الرئيسية (كل القطاعات)</option>
            {wings.map((w) => <option key={w.slug} value={w.slug}>{w.name_ar}</option>)}
          </select>
        </label>
      </div>
      <label>ملاحظات<textarea name="note" rows={2} placeholder="نبذة عن ماركتك، أو ما تريد إبرازه في المساحة" /></label>
      {state && !state.ok && <p className="error">{state.message}</p>}
      <button className="btn btn-gold" disabled={pending}>{pending ? "جارٍ الإرسال…" : "أرسل طلب الحجز"}</button>
      <p className="hint">نتواصل معك خلال يوم عمل لتأكيد المساحة والمدّة وإرسال بيانات التحويل.</p>
    </form>
  );
}
