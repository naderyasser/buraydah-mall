import Link from "next/link";
import Riyal from "@/components/Riyal";
import { requireAdmin } from "@/lib/auth";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { AD_SIZES, adPrices } from "@/lib/ads";
import { getWings } from "@/lib/queries";
import { createPlacement, setPlacementStatus, setAdRequestStatus } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "المساحات الإعلانية" };
const SIZE_AR: Record<string, string> = { full: "كاملة", half: "نصف", quarter: "ربع", small: "خانة" };
const ST: Record<string, string> = { pending: "بانتظار الدفع", active: "فعّال", expired: "منتهٍ", cancelled: "ملغى" };

function PAct({ id, status, cls, label }: { id: number; status: string; cls: string; label: string }) {
  return (
    <form action={setPlacementStatus}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
      <button className={cls}>{label}</button>
    </form>
  );
}

/** إدارة المول الإعلاني: طلبات الحجز، الحجوزات الحيّة وتقاريرها، وحجز مساحة لماركة */
export default async function AdsAdmin() {
  await requireAdmin();
  const [requests, placements, spaces, stores, wings, prices] = await Promise.all([
    q<any>(`SELECT * FROM ad_requests ORDER BY (status = 'new') DESC, created_at DESC LIMIT 60`),
    q<any>(
      `SELECT p.id, p.status, p.price, p.headline, p.note, p.starts_on::text AS starts_on, p.ends_on::text AS ends_on,
              sp.zone, sp.size, sp.position, s.name_ar AS store,
              coalesce((SELECT sum(n) FROM ad_impressions i WHERE i.placement_id = p.id AND i.day > current_date - 30), 0)::int AS imp30,
              (SELECT count(*) FROM clicks c WHERE c.placement_id = p.id AND c.created_at > now() - interval '30 days')::int AS clk30
       FROM ad_placements p JOIN ad_spaces sp ON sp.id = p.space_id JOIN stores s ON s.id = p.store_id
       ORDER BY (p.status = 'active') DESC, p.ends_on DESC LIMIT 120`),
    q<any>(
      `SELECT sp.id, sp.zone, sp.size, sp.position,
              (SELECT s.name_ar FROM ad_placements p JOIN stores s ON s.id = p.store_id
                WHERE p.space_id = sp.id AND p.status = 'active' AND p.starts_on <= current_date AND p.ends_on >= current_date LIMIT 1) AS taken_by
       FROM ad_spaces sp WHERE sp.is_active ORDER BY (sp.zone = 'home') DESC, sp.zone, sp.size, sp.position`),
    q<{ id: number; name_ar: string }>(`SELECT id, name_ar FROM stores WHERE is_active ORDER BY name_ar`),
    getWings(), adPrices(),
  ]);
  const freeSpaces = spaces.filter((s: any) => !s.taken_by);
  const zoneName = (z: string) => z === "home" ? "الرئيسية" : (wings.find((w) => `wing:${w.slug}` === z)?.name_ar ?? z);

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>المساحات الإعلانية</h2>
        <span className="tabular">{placements.filter((p: any) => p.status === "active").length} حجزاً فعّالاً · {freeSpaces.length} مساحة متاحة · <Link href="/admin/settings">الأسعار</Link></span>
      </div>

      {/* حجز مساحة لماركة */}
      <form action={createPlacement} className="panel form" style={{ marginBottom: 18 }}>
        <b>حجز مساحة لماركة</b>
        <div className="form-grid">
          <label>الماركة / المتجر<select name="store_id" required>{stores.map((s) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}</select></label>
          <label>المساحة
            <select name="space_id" required>
              {freeSpaces.map((s: any) => <option key={s.id} value={s.id}>{zoneName(s.zone)} — {SIZE_AR[s.size]} #{s.position}</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label>من<input type="date" name="starts_on" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
          <label>عدد الأشهر<select name="months" defaultValue="1">{[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
          <label>السعر الإجمالي (فارغ = حسب الأسعار)<input name="price" type="number" step="1" dir="ltr" placeholder={`كاملة ${prices.full} · نصف ${prices.half} · ربع ${prices.quarter} · خانة ${prices.small}`} /></label>
        </div>
        <div className="form-grid">
          <label>عنوان إعلاني (اختياري، للكاملة والنصف)<input name="headline" placeholder="مثال: تشكيلة شتاء 2026 — خصم 30٪ على الموقع" /></label>
          <label>صورة إعلانية (اختياري)<input type="file" name="image" accept="image/png,image/jpeg,image/webp" /></label>
        </div>
        <div className="form-grid">
          <label>الحالة<select name="status" defaultValue="active"><option value="active">فعّال (وصل التحويل)</option><option value="pending">بانتظار الدفع</option></select></label>
          <label>ملاحظة<input name="note" placeholder="رقم الحوالة، اسم المسؤول…" /></label>
        </div>
        <button className="btn btn-brand">احجز</button>
      </form>

      {/* طلبات الحجز */}
      <div className="section-head"><h2>طلبات الحجز ({requests.filter((r: any) => r.status === "new").length} جديد)</h2></div>
      <div className="tablewrap"><table className="admin">
        <thead><tr><th>الماركة</th><th>الجوال</th><th>الموقع</th><th>المساحة</th><th>المدّة</th><th>القطاع</th><th>ملاحظة</th><th>الحالة</th></tr></thead>
        <tbody>{requests.map((r: any) => (
          <tr key={r.id} style={{ opacity: r.status === "rejected" ? .5 : 1 }}>
            <td>{r.brand_name}{r.contact_name ? <><br /><span className="hint">{r.contact_name}</span></> : null}</td>
            <td className="tabular" dir="ltr"><a href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "").replace(/^0/, "966")}`} target="_blank" rel="noopener">{r.phone}</a></td>
            <td dir="ltr" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{r.website}</td>
            <td>{SIZE_AR[r.size]}</td><td className="tabular">{r.months} شهر</td><td>{r.wing_slug ? zoneName(`wing:${r.wing_slug}`) : "الرئيسية"}</td>
            <td style={{ maxWidth: 220 }}>{r.note}</td>
            <td>
              <form action={setAdRequestStatus} style={{ display: "flex", gap: 4 }}>
                <input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={r.status}>
                  <option value="new">جديد</option><option value="contacted">تمّ التواصل</option><option value="booked">حُجز</option><option value="rejected">مرفوض</option>
                </select>
                <button className="btn btn-line btn-sm">حفظ</button>
              </form>
            </td>
          </tr>))}</tbody>
      </table></div>

      {/* الحجوزات */}
      <div className="section-head" style={{ marginTop: 28 }}><h2>الحجوزات</h2><span>الظهور والنقرات لآخر ٣٠ يوماً — ما يُطالَب به المعلن يجب أن يكون قابلاً للإثبات</span></div>
      <div className="tablewrap"><table className="admin">
        <thead><tr><th>الماركة</th><th>المساحة</th><th>من</th><th>إلى</th><th>السعر</th><th>ظهور</th><th>نقرات</th><th>الحالة</th><th></th></tr></thead>
        <tbody>{placements.map((p: any) => (
          <tr key={p.id} style={{ opacity: ["expired", "cancelled"].includes(p.status) ? .5 : 1 }}>
            <td>{p.store}{p.headline ? <><br /><span className="hint">{p.headline}</span></> : null}</td>
            <td>{zoneName(p.zone)} — {SIZE_AR[p.size]} #{p.position}</td>
            <td className="tabular">{p.starts_on}</td><td className="tabular">{p.ends_on}</td>
            <td className="tabular">{sar(p.price)} <Riyal /></td>
            <td className="tabular">{p.imp30}</td><td className="tabular">{p.clk30}</td>
            <td><span className={`badge st-${p.status === "active" ? "confirmed" : p.status === "pending" ? "new" : "cancelled"}`}>{ST[p.status]}</span></td>
            <td>
              <div style={{ display: "flex", gap: 4 }}>
                {p.status === "pending" && <PAct id={p.id} status="active" cls="btn btn-brand btn-sm" label="تفعيل" />}
                {p.status === "active" && <PAct id={p.id} status="cancelled" cls="btn btn-line btn-sm" label="إيقاف" />}
                {(p.status === "cancelled" || p.status === "expired") && <PAct id={p.id} status="active" cls="btn btn-line btn-sm" label="إعادة تفعيل" />}
              </div>
            </td>
          </tr>))}</tbody>
      </table></div>
      {placements.length === 0 && <p className="hint">لا حجوزات بعد — احجز أول مساحة من النموذج أعلاه.</p>}
    </div>
  );
}
