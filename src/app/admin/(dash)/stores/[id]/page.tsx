import Link from "next/link";
import { notFound } from "next/navigation";
import HoursEditor from "@/components/HoursEditor";
import { saveStore } from "@/app/admin/actions";
import { q1 } from "@/db";
import { getWings } from "@/lib/queries";
import { DEST_META } from "@/lib/destinations";
import type { DestType, Store } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل محل" };

export default async function StoreEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const store = isNew ? null : await q1<Store>(`SELECT * FROM stores WHERE id = $1`, [Number(id)]);
  if (!isNew && !store) notFound();
  const wings = await getWings();

  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <nav className="crumbs" style={{ marginTop: 24 }}>
        <Link href="/admin/stores">المحلات</Link> ‹ {isNew ? "محل جديد" : store!.name_ar}
      </nav>
      <section className="hero" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <h1>{isNew ? "إضافة محل" : store!.name_ar}</h1>
      </section>

      <form action={saveStore} className="panel form" style={{ marginTop: 24 }}>
        {!isNew && <input type="hidden" name="id" value={store!.id} />}
        {!isNew && <input type="hidden" name="logo_path" value={store!.logo_path ?? ""} />}

        <div className="form-grid">
          <label>اسم المحل بالعربية *<input name="name_ar" required defaultValue={store?.name_ar ?? ""} /></label>
          <label>الاسم بالإنجليزية<input name="name_en" dir="ltr" defaultValue={store?.name_en ?? ""} /></label>
          <label>
            الجناح *
            <select name="wing_id" required defaultValue={store?.wing_id ?? ""}>
              <option value="">— اختر —</option>
              {wings.map((w) => <option key={w.id} value={w.id}>{w.name_ar}</option>)}
            </select>
          </label>
          <label>
            الرابط الثابت (slug)
            <input name="slug" dir="ltr" defaultValue={store?.slug ?? ""} placeholder="يُولَّد تلقائياً" />
            <span className="hint">لا تغيّره بعد النشر — الروابط المنشورة تعتمد عليه.</span>
          </label>
        </div>

        <label>نبذة قصيرة<textarea name="summary_ar" rows={2} defaultValue={store?.summary_ar ?? ""} /></label>
        <label>
          وسوم السلع
          <input name="tags" defaultValue={store?.tags?.join("، ") ?? ""} placeholder="ذهب عيار 21، أطقم زواج" />
          <span className="hint">افصل بينها بفاصلة. هذه ما يبحث به الناس فعلاً.</span>
        </label>

        <div className="form-grid">
          <label>
            نوع الوجهة *
            <select name="dest_type" defaultValue={store?.dest_type ?? "whatsapp"}>
              {(Object.keys(DEST_META) as DestType[]).map((k) => (
                <option key={k} value={k}>{DEST_META[k].label} — «{DEST_META[k].button}»</option>
              ))}
            </select>
          </label>
          <label>
            قيمة الوجهة *
            <input name="dest_value" required dir="ltr" defaultValue={store?.dest_value ?? ""}
              placeholder="05xxxxxxxx أو @حساب أو رابط" />
          </label>
        </div>
        <label>
          نص رسالة الواتساب الجاهزة
          <input name="whatsapp_text" defaultValue={store?.whatsapp_text ?? ""} placeholder="يُملأ تلقائياً لو تُرك فارغاً" />
        </label>

        <div className="form-grid">
          <label>الحي<input name="district" defaultValue={store?.district ?? ""} /></label>
          <label>المدينة<input name="city" defaultValue={store?.city ?? "بريدة"} /></label>
          <label>العنوان<input name="address_line" defaultValue={store?.address_line ?? ""} /></label>
          <label>الجوال<input name="phone" dir="ltr" defaultValue={store?.phone ?? ""} /></label>
          <label>رابط الخريطة<input name="map_url" dir="ltr" defaultValue={store?.map_url ?? ""} /></label>
          <label>
            الفئة
            <select name="tier" defaultValue={store?.tier ?? "free"}>
              <option value="free">مجاني</option>
              <option value="paid">مدفوع</option>
              <option value="featured">مميّز</option>
            </select>
          </label>
          <label>ترتيب الظهور<input name="sort_order" type="number" defaultValue={store?.sort_order ?? 100} /></label>
        </div>

        <label>
          الشعار
          <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
          <span className="hint">
            {store?.logo_path ? `الحالي: ${store.logo_path} — ارفع ملفاً جديداً لاستبداله.` : "اتركه فارغاً ليُعرض اسم المحل بخط واضح بدل مربع فارغ."}
          </span>
        </label>

        <div>
          <span style={{ fontSize: 14, color: "var(--text-2)" }}>الدوام</span>
          <HoursEditor initial={store?.hours} />
        </div>

        <label className="chk" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" name="is_active" defaultChecked={store?.is_active ?? true} />
          منشور في الموقع
        </label>

        <button className="btn btn-brand" type="submit">حفظ</button>
      </form>
    </div>
  );
}
