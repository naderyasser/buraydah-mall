/** خيارات الفرز — في ملف مستقل لأن مكوّن الفرز عميل ولا يجوز أن يجرّ قاعدة البيانات */
export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "popular" | "rating";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "الأنسب" },
  { key: "newest", label: "الأحدث" },
  { key: "price_asc", label: "بالسعر من الأدنى إلى الأعلى" },
  { key: "price_desc", label: "بالسعر من الأعلى إلى الأدنى" },
  { key: "popular", label: "الأكثر مشاهدة" },
  { key: "rating", label: "الأعلى تقييماً" },
];
