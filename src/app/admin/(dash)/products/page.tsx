import Link from "next/link";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { toggleProduct } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "المنتجات" };

export default async function ProductsAdmin() {
  const rows = await q<any>(
    `SELECT p.id, p.name_ar, p.slug, p.price, p.unit, p.is_active, p.in_stock, p.image_path,
            s.name_ar AS store, w.name_ar AS wing,
            (SELECT coalesce(sum(oi.qty),0)::int FROM order_items oi WHERE oi.product_id = p.id) AS sold
     FROM products p JOIN stores s ON s.id = p.store_id JOIN wings w ON w.id = s.wing_id
     ORDER BY p.is_active DESC, w.sort_order, s.name_ar, p.sort_order`
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>المنتجات ({rows.length})</h2>
        <Link className="btn btn-gold btn-sm" href="/admin/products/new">+ منتج جديد</Link>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead><tr><th></th><th>المنتج</th><th>المحل</th><th>السعر</th><th>مبيع</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.5 }}>
                <td style={{ width: 52 }}>
                  {r.image_path && <img src={r.image_path} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 3 }} />}
                </td>
                <td>{r.name_ar}</td>
                <td>{r.store}<br /><span className="hint">{r.wing}</span></td>
                <td className="tabular">{sar(r.price)} ر.س<br /><span className="hint">{r.unit}</span></td>
                <td className="tabular">{r.sold}</td>
                <td>
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-line btn-sm">{r.is_active ? "معروض" : "مخفي"}</button>
                  </form>
                </td>
                <td><Link href={`/admin/products/${r.id}`}>تعديل</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
