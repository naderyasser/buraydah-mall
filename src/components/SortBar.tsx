"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS } from "@/lib/sorts";

/** الفرز يغيّر الرابط لا الحالة — فيبقى قابلاً للمشاركة والرجوع */
export default function SortBar({ total }: { total: number }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();

  const change = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v === "featured") next.delete("sort"); else next.set("sort", v);
    next.delete("page");
    router.push(`${path}?${next.toString()}`);
  };

  return (
    <div className="sortbar">
      <span className="tabular">{total} منتجاً</span>
      <label>
        ترتيب:
        <select value={params.get("sort") ?? "featured"} onChange={(e) => change(e.target.value)}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </label>
    </div>
  );
}
