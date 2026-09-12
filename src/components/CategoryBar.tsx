"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WingIcon from "./WingIcon";
import type { Wing } from "@/lib/types";

/**
 * صفّ الأقسام بأيقونات كما في حراج: يُقرأ بنظرة، ويُسحب بالإصبع على الجوال.
 * الأقسام تُمرَّر من التخطيط: استعلام واحد لا اثنان في كل صفحة.
 */
const SHORT: Record<string, string> = { gold: "ذهب", watches: "ساعات", bags: "شنط", fabrics: "أقمشة", clothing: "ملابس", dresses: "فساتين" };

export default function CategoryBar({ wings }: { wings: Wing[] }) {
  // الرئيسية ترسم دوائر الأقسام فوق الواجهة النجدية بنفسها
  if (usePathname() === "/") return null;
  return (
    <nav className="catbar" aria-label="أقسام المول">
      <div className="wrap">
        <Link href="/search?q=%D8%A7%D9%84%D9%83%D9%84" className="cat-tile"><WingIcon slug="all" /><span>الكل</span></Link>
        {wings.map((w) => (
          <Link key={w.slug} href={`/wing/${w.slug}`} className="cat-tile">
            <WingIcon slug={w.slug} /><span>{SHORT[w.slug] ?? w.name_ar.replace(/^ال/, "")}</span>
          </Link>
        ))}
        <Link href="/stores" className="cat-tile"><WingIcon slug="stores" /><span>المحلات</span></Link>
      </div>
    </nav>
  );
}
