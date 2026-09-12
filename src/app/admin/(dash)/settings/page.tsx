import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "إعدادات المول" };

export default async function SettingsAdmin() {
  await requireAdmin();
  const s = await getSettings(["mall_whatsapp", "gold_gram_24", "gold_gram_21", "gold_gram_18"]);
  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}><h2>إعدادات المول</h2></div>
      <form action={saveSettings} className="panel form" style={{ maxWidth: 720 }}>
        <label>رقم واتساب المول (يظهر كزرّ عائم في كل الصفحات — اتركه فارغاً لإخفاء الزر)
          <input name="mall_whatsapp" dir="ltr" placeholder="05xxxxxxxx" defaultValue={s.mall_whatsapp} /></label>
        <div className="section-head" style={{ marginTop: 16 }}><h2 style={{ fontSize: 16 }}>سعر جرام الذهب اليوم (ر.س، شامل الضريبة إن كان يُعرض كذلك)</h2></div>
        <div className="form-grid">
          <label>عيار ٢٤<input name="gold_gram_24" type="number" step="0.01" dir="ltr" defaultValue={s.gold_gram_24} /></label>
          <label>عيار ٢١<input name="gold_gram_21" type="number" step="0.01" dir="ltr" defaultValue={s.gold_gram_21} /></label>
          <label>عيار ١٨<input name="gold_gram_18" type="number" step="0.01" dir="ltr" defaultValue={s.gold_gram_18} /></label>
        </div>
        <p className="hint">يُعرض سعر الجرام في جناح الذهب وفي صفحة كل منتج له وزن — كما تفعل محلات الذهب السعودية. حدّثه يومياً أو اتركه فارغاً.</p>
        <button className="btn btn-brand">احفظ</button>
      </form>
    </div>
  );
}
