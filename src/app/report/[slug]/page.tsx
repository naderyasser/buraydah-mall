import Link from "next/link";
import { notFound } from "next/navigation";
import SubmitForm from "@/components/SubmitForm";
import { submitErrorReport } from "@/app/actions";
import { getStore } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإبلاغ عن خطأ" };

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const store = await getStore((await params).slug);
  if (!store) notFound();
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <nav className="crumbs">
        <Link href={`/store/${store.slug}`}>{store.name_ar}</Link> ‹ الإبلاغ عن خطأ
      </nav>
      <section className="hero" style={{ paddingTop: 18 }}>
        <h1>بيانات غير صحيحة؟</h1>
        <p>دوام خاطئ أو رقم قديم يضرّ بالمحل وبنا. أخبرنا ونصحّحه.</p>
      </section>
      <SubmitForm action={submitErrorReport} submitLabel="أرسل البلاغ">
        <input type="hidden" name="store_id" value={store.id} />
        <label>
          ما الخطأ؟
          <select name="field" defaultValue="hours">
            <option value="hours">الدوام</option>
            <option value="phone">رقم التواصل</option>
            <option value="address">العنوان</option>
            <option value="closed">المحل مغلق نهائياً</option>
            <option value="other">شيء آخر</option>
          </select>
        </label>
        <label>التفاصيل<textarea name="note" rows={4} required /></label>
      </SubmitForm>
    </div>
  );
}
