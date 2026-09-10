import Link from "next/link";
import SubmitForm from "@/components/SubmitForm";
import { submitJoinRequest } from "@/app/actions";
import { getWings } from "@/lib/queries";

export const revalidate = 3600;
export const metadata = { title: "انضم إلى المول" };

export default async function JoinPage() {
  const wings = await getWings();
  return (
    <div className="wrap" style={{ maxWidth: 700 }}>
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ انضم إلى المول</nav>
      <section className="hero" style={{ paddingTop: 18 }}>
        <h1>انضم إلى المول</h1>
        <p>
          الوجود في الدليل مجاني. اترك بياناتك ونتواصل معك لتجهيز صفحة محلك —
          العنوان والدوام ورقم التواصل. المساحات المميّزة داخل الجناح تُبحث بعد النشر.
        </p>
      </section>
      <SubmitForm action={submitJoinRequest} submitLabel="أرسل الطلب">
        <label>اسم المحل<input name="store_name" required /></label>
        <label>اسم المسؤول<input name="contact_name" /></label>
        <label>رقم الجوال<input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" /></label>
        <label>
          الجناح
          <select name="wing_id" defaultValue="">
            <option value="">— اختر —</option>
            {wings.map((w) => <option value={w.id} key={w.id}>{w.name_ar}</option>)}
          </select>
        </label>
        <label>ملاحظات<textarea name="note" rows={3} placeholder="ماذا تبيعون؟ أين موقعكم؟" /></label>
      </SubmitForm>
    </div>
  );
}
