import Link from "next/link";
import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { logout } from "../actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLoggedIn())) redirect("/admin/login");
  return (
    <>
      <div className="admin-bar">
        <div className="wrap">
          <Link href="/admin">اللوحة</Link>
          <Link href="/admin/orders">الطلبات</Link>
          <Link href="/admin/products">المنتجات</Link>
          <Link href="/admin/stores">المحلات</Link>
          <Link href="/admin/wings">الأقسام</Link>
          <Link href="/admin/categories">التصنيفات</Link>
          <Link href="/admin/reviews">التقييمات</Link>
          <Link href="/admin/coupons">الكوبونات</Link>
          <Link href="/admin/merchants">حسابات التجار</Link>
          <Link href="/admin/requests">الطلبات والبلاغات</Link>
          <span className="sep" />
          <Link href="/">عرض الموقع</Link>
          <form action={logout}>
            <button className="btn btn-line btn-sm">خروج</button>
          </form>
        </div>
      </div>
      {children}
    </>
  );
}
