import Link from "next/link";
import { redirect } from "next/navigation";
import { currentStore } from "@/lib/merchant-auth";
import { merchantLogout } from "../actions";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const store = await currentStore();
  if (!store) redirect("/merchant/login");

  return (
    <>
      <div className="admin-bar merchant">
        <div className="wrap">
          <b className="mstore">{store.name_ar}</b>
          <Link href="/merchant">لوحتي</Link>
          <Link href="/merchant/orders">الطلبات</Link>
          <Link href="/merchant/products">منتجاتي</Link>
          <Link href="/merchant/requests">طلبات الشراء</Link>
          <Link href="/merchant/settlements">المحفظة</Link>
          <Link href="/merchant/reviews">التقييمات</Link>
          <Link href="/merchant/questions">الأسئلة</Link>
          <Link href="/merchant/settings">بيانات المحل</Link>
          <span className="sep" />
          <Link href={`/store/${store.slug}`}>صفحتي</Link>
          <form action={merchantLogout}><button className="btn btn-line btn-sm">خروج</button></form>
        </div>
      </div>
      {children}
    </>
  );
}
