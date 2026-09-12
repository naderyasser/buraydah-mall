import Link from "next/link";
import { redirect } from "next/navigation";
import { currentStore } from "@/lib/merchant-auth";
import { merchantLogout } from "../actions";
import { currentOccasion, upcomingOccasion } from "@/lib/saudi";
import NewOrderWatcher from "@/components/NewOrderWatcher";
import { q1 } from "@/db";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const store = await currentStore();
  if (!store) redirect("/merchant/login");
  const occ = currentOccasion() ?? upcomingOccasion();
  const fresh = await q1<{ n: number }>(`SELECT count(DISTINCT order_id)::int AS n FROM order_items WHERE store_id = $1 AND status = 'new'`, [store.id]);

  return (
    <>
      <div className="admin-bar merchant">
        <div className="wrap">
          <b className="mstore">{store.name_ar}</b>
          <Link href="/merchant">لوحتي</Link>
          <Link href="/merchant/orders" className="nav-with-badge">الطلبات<NewOrderWatcher initial={fresh?.n ?? 0} /></Link>
          <Link href="/merchant/products">منتجاتي</Link>
          <Link href="/merchant/requests">طلبات الشراء</Link>
          <Link href="/merchant/settlements">المحفظة</Link>
          <Link href="/merchant/reviews">التقييمات</Link>
          <Link href="/merchant/questions">الأسئلة</Link>
          <Link href="/merchant/settings">بيانات المحل</Link>
          {occ && <Link href="/merchant/occasion" className="occ-link">عروض {occ.label}</Link>}
          <span className="sep" />
          <Link href={`/store/${store.slug}`}>صفحتي</Link>
          <form action={merchantLogout}><button className="btn btn-line btn-sm">خروج</button></form>
        </div>
      </div>
      {children}
    </>
  );
}
