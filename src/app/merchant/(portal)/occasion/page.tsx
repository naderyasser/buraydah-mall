import Link from "next/link";
import Riyal from "@/components/Riyal";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { requireStore } from "@/lib/merchant-auth";
import { currentOccasion, upcomingOccasion, occasionEnd, OCCASION_COUPON, OCCASION_TAG } from "@/lib/saudi";
import { merchantJoinOccasion, merchantLeaveOccasion } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "عروض المناسبة", robots: { index: false } };

export default async function MerchantOccasion() {
  const store = await requireStore();
  const now = new Date();
  const occ = currentOccasion(now) ?? upcomingOccasion(now);
  const win = occasionEnd(now);
  const rows = await q<any>(
    `SELECT id, name_ar, price, compare_price, unit, image_path, in_stock, sale_ends_at, tags
     FROM products WHERE store_id = $1 AND is_active ORDER BY sort_order, id`, [store.id]);
  const joined = rows.filter((r: any) => (r.tags ?? []).includes(OCCASION_TAG));
  const rest = rows.filter((r: any) => !(r.tags ?? []).includes(OCCASION_TAG));

  if (!occ || !win) {
    return (
      <div className="wrap"><section className="section"><h1 style={{ fontSize: 24 }}>عروض المناسبة</h1>
        <p className="hint">لا مناسبة قريبة الآن. تُفتح هذه الصفحة قبل اليوم الوطني ويوم التأسيس ورمضان والعيدين.</p></section></div>
    );
  }
  const endTxt = win.ends.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", timeZone: "Asia/Riyadh" });

  return (
    <div className="wrap">
      <section className="section" style={{ paddingBottom: 0 }}>
        <h1 style={{ fontSize: 24 }}>عروض {occ.label}</h1>
        <p style={{ color: "var(--mut)", maxWidth: "62ch" }}>
          اختر منتجاتك ونسبة الخصم، والمول يحفظ سعرك الأصلي ويعرض الخصم حتى <b>{endTxt}</b> ثم يعيد السعر تلقائياً.
          تظهر عروضك في <Link href="/national-day">صفحة {occ.label}</Link> وفي الرئيسية بشارة خاصة.
          {OCCASION_COUPON[occ.key] && <> كود المول الموحّد <b dir="ltr">{OCCASION_COUPON[occ.key]}</b> يُخصم فوق سعرك عند الاستلام — احسبه في هامشك.</>}
        </p>
      </section>

      {joined.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>منتجاتك المشاركة ({joined.length})</h2></div>
          <div className="tablewrap"><table className="admin">
            <thead><tr><th>المنتج</th><th>قبل</th><th>الآن</th><th>الخصم</th><th></th></tr></thead>
            <tbody>{joined.map((r: any) => (
              <tr key={r.id}>
                <td>{r.name_ar}</td>
                <td className="tabular"><s>{sar(r.compare_price)}</s></td>
                <td className="tabular" style={{ color: "var(--price)", fontWeight: 700 }}>{sar(r.price)} <Riyal /></td>
                <td className="tabular">{Math.round((1 - Number(r.price) / Number(r.compare_price)) * 100)}٪</td>
                <td><form action={merchantLeaveOccasion}><input type="hidden" name="id" value={r.id} /><button className="btn btn-line btn-sm">سحب</button></form></td>
              </tr>))}</tbody>
          </table></div>
        </section>
      )}

      <section className="section">
        <div className="section-head"><h2>أضف منتجات إلى العرض</h2></div>
        {rest.length === 0 ? <p className="hint">كل منتجاتك مشاركة.</p> : (
          <form action={merchantJoinOccasion} className="panel form">
            <div className="occ-list">
              {rest.map((r: any) => (
                <label key={r.id} className="occ-item">
                  <input type="checkbox" name="product_id" value={r.id} />
                  {r.image_path ? <img src={r.image_path} alt="" /> : <span className="occ-noimg" />}
                  <span className="occ-name">{r.name_ar}</span>
                  <span className="tabular occ-price">{sar(r.price)} <Riyal /></span>
                </label>
              ))}
            </div>
            <div className="form-grid" style={{ alignItems: "end", marginTop: 14 }}>
              <label>نسبة الخصم
                <select name="pct" defaultValue="10">
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((n) => <option key={n} value={n}>{n}٪</option>)}
                </select>
              </label>
              <button className="btn btn-brand">شارك في العرض</button>
            </div>
            <p className="hint">الأسعار كما تُعرض للزبون شاملة الضريبة. يمكنك السحب في أي وقت.</p>
          </form>
        )}
      </section>
    </div>
  );
}
