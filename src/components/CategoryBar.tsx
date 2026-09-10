import Link from "next/link";
import type { Wing } from "@/lib/types";

/**
 * شريط الأقسام تحت الترويسة — أسرع طريق للقسم من أي صفحة.
 * الأقسام تُمرَّر من التخطيط: استعلام واحد لا اثنان في كل صفحة.
 */
export default function CategoryBar({ wings }: { wings: Wing[] }) {
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
