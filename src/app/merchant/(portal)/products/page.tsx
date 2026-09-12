import Link from "next/link";
import Riyal from "@/components/Riyal";
import { q } from "@/db";
import { sar } from "@/lib/money";
import { requireStore } from "@/lib/merchant-auth";
import { merchantToggleProduct, merchantSetStock } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "منتجاتي", robots: { index: false } };

export default async function MerchantProducts() {
  const store = await requireStore();
  const rows = await q<any>(
    `SELECT p.id, p.name_ar, p.slug, p.price, p.compare_price, p.unit, p.image_path,
            p.is_active, p.in_stock, p.views,
            (SELECT coalesce(sum(oi.qty),0)::int FROM order_items oi
               WHERE oi.product_id = p.id AND oi.status <> 'cancelled') AS sold
     FROM products p WHERE p.store_id = $1
     ORDER BY p.is_active DESC, p.sort_order, p.id`,
    [store.id]
  );

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 32 }}>
        <h2>منتجاتك ({rows.length})</h2>
        <span>لإضافة منتج جديد راسل إدارة المول — الإضافة بمراجعة</span>
      </div>
      <div className="tablewrap">
        <table className="admin">
          <thead>
            <tr><th></th><th>المنتج</th><th>السعر</th><th>مبيع</th><th>مشاهدات</th><th>التوفّر</th><th>العرض</th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.5 }}>
                <td style={{ width: 52 }}>
                  {r.image_path && <img src={r.image_path} alt=""
                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />}
                </td>
                <td><Link href={`/product/${r.slug}`}>{r.name_ar}</Link></td>
                <td className="tabular">{sar(r.price)} <Riyal /><br />
                  {r.compare_price && <span className="hint"><s>{sar(r.compare_price)}</s></span>}</td>
                <td className="tabular">{r.sold}</td>
                <td className="tabular">{r.views}</td>
                <td>
                  <form action={merchantSetStock}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-line btn-sm">{r.in_stock ? "متوفّر" : "نفد"}</button>
                  </form>
                </td>
                <td>
                  <form action={merchantToggleProduct}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-line btn-sm">{r.is_active ? "معروض" : "مخفي"}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7}>لا منتجات بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
