import { q } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { saveMerchant, toggleMerchant } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "حسابات التجار" };

export default async function MerchantsAdmin() {
  await requireAdmin();
  const [rows, stores] = await Promise.all([
    q<any>(
      `SELECT m.*, s.name_ar AS store FROM merchants m JOIN stores s ON s.id = m.store_id
       ORDER BY m.is_active DESC, s.name_ar`
    ),
    q<any>(`SELECT id, name_ar FROM stores WHERE is_active ORDER BY name_ar`),
  ]);

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>حسابات التجار ({rows.length})</h2>
        <span>الإدارة تُنشئ الحساب — بوابة التاجر ليست تسجيلاً حراً</span>
      </div>

      <form action={saveMerchant} className="panel form" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <label>
            المحل
            <select name="store_id" required>
              {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </label>
          <label>اسم المستخدم<input name="username" required dir="ltr" /></label>
        </div>
        <label>
          كلمة المرور (٦ أحرف فأكثر)
          <input name="password" type="text" dir="ltr" placeholder="اتركها فارغة لتغيير الاسم فقط" />
        </label>
        <button className="btn btn-brand">احفظ الحساب</button>
        <p className="hint">
          سلّم التاجر اسم المستخدم وكلمة المرور بنفسك — لا تُخزَّن كلمة المرور نصاً ولا يمكن استرجاعها.
        </p>
      </form>

      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th>المحل</th><th>اسم المستخدم</th><th>آخر دخول</th><th>الحالة</th></tr></thead>
          <tbody>
            {rows.map((m: any) => (
              <tr key={m.id} style={{ opacity: m.is_active ? 1 : 0.5 }}>
                <td>{m.store}</td>
                <td className="tabular" dir="ltr">{m.username}</td>
                <td className="tabular">
                  {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString("ar-SA-u-nu-latn") : "لم يدخل بعد"}
                </td>
                <td>
                  <form action={toggleMerchant}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-line btn-sm">{m.is_active ? "فعّال" : "موقوف"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4}>لا حسابات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
