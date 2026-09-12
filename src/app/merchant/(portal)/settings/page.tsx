import HoursEditor from "@/components/HoursEditor";
import { requireStore } from "@/lib/merchant-auth";
import { merchantSaveSettings } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "بيانات محلي", robots: { index: false } };

export default async function MerchantSettings() {
  const store = await requireStore();

  return (
    <div className="wrap" style={{ maxWidth: 800 }}>
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>بيانات المحل</h2>
        <span>ما تكتبه هنا يظهر للزبون في صفحتك</span>
      </div>

      <form action={merchantSaveSettings} className="panel form">
        <label>نبذة عن المحل<textarea name="summary_ar" rows={3} defaultValue={store.summary_ar ?? ""} /></label>

        <div className="form-grid">
          <label>الجوال / واتساب<input name="phone" dir="ltr" defaultValue={store.phone ?? ""} /></label>
          <label>الحي<input name="district" defaultValue={store.district ?? ""} list="buraydah-districts" autoComplete="off" /></label>
        </div>
        <label>العنوان<input name="address_line" defaultValue={store.address_line ?? ""} /></label>
        <label>رابط الموقع على الخريطة<input name="map_url" dir="ltr" defaultValue={store.map_url ?? ""} /></label>

        <div className="form-grid">
          <label>رسوم التوصيل (ر.س)
            <input name="delivery_fee" type="number" min={0} step="0.5" dir="ltr"
                   defaultValue={Number(store.delivery_fee ?? 0)} /></label>
          <label>توصيل مجاني فوق (ر.س)
            <input name="free_delivery_over" type="number" min={0} step="1" dir="ltr"
                   defaultValue={store.free_delivery_over ?? ""} placeholder="اتركه فارغاً = لا يوجد" /></label>
        </div>

        <label>سياسة الاستبدال والاسترجاع لدى محلك
          <textarea name="returns_policy" rows={3} defaultValue={store.returns_policy ?? ""}
            placeholder="مثال: استبدال خلال ٧ أيام بالفاتورة وبحالته الأصلية." /></label>

        <div className="section-head" style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 16 }}>بيانات الإفصاح النظامية</h3>
          <span>يوجبها نظام التجارة الإلكترونية</span>
        </div>
        <div className="form-grid">
          <label>السجل التجاري<input name="cr_number" dir="ltr" defaultValue={store.cr_number ?? ""} /></label>
          <label>الرقم الضريبي<input name="vat_number" dir="ltr" defaultValue={store.vat_number ?? ""} /></label>
        </div>
        <label>رقم معروف (maroof.sa)<input name="maroof_number" dir="ltr" defaultValue={store.maroof_number ?? ""} /></label>

        <div>
          <span style={{ fontSize: 13.5, color: "var(--mut)" }}>الدوام</span>
          <HoursEditor initial={store.hours} />
        </div>

        <button className="btn btn-brand">احفظ البيانات</button>
        <p className="hint">
          فئة المحل وترتيبه داخل المول تحدّدهما إدارة المول، لا التاجر.
        </p>
      </form>
    </div>
  );
}
