import Link from "next/link";
import { getWings } from "@/lib/queries";

/** شريط الأقسام تحت الترويسة — أسرع طريق للقسم من أي صفحة */
export default async function CategoryBar() {
  const wings = await getWings();
  return (
    <nav className="catbar" aria-label="أقسام المول">
      <div className="wrap">
        <Link href="/search?q=%D8%A7%D9%84%D9%83%D9%84">كل المنتجات</Link>
        {wings.map((w) => (
          <Link key={w.slug} href={`/wing/${w.slug}`}>{w.name_ar}</Link>
        ))}
      </div>
    </nav>
  );
}
