/**
 * قارئ CSV صغير يكفي ملفات إكسل «حفظ باسم CSV UTF-8»: يتعامل مع BOM والفاصلة
 * والفاصلة المنقوطة (إكسل العربي يصدّر بها) والحقول المقتبسة والأسطر داخل الاقتباس.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQ = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const header = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  return rows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** رؤوس الأعمدة المقبولة — بالعربية أو الإنجليزية، كما يكتبها التاجر لا كما يحبّها المبرمج */
export const COLS: Record<string, string[]> = {
  name: ["name", "name_ar", "الاسم", "اسم المنتج", "المنتج"],
  price: ["price", "السعر"],
  compare_price: ["compare_price", "السعر قبل الخصم", "قبل الخصم", "was"],
  unit: ["unit", "الوحدة"],
  category: ["category", "التصنيف", "القسم الفرعي"],
  tags: ["tags", "الوسوم", "وسوم"],
  description: ["description", "description_ar", "الوصف"],
  in_stock: ["in_stock", "متوفر", "متوفّر", "التوفر"],
  variant_label: ["variant_label", "الخيار", "اسم الخيار"],
  variants: ["variants", "الخيارات"],
  image: ["image", "image_url", "الصورة", "رابط الصورة"],
};
export function pick(row: Record<string, string>, key: string): string {
  for (const k of COLS[key]) if (row[k] !== undefined && row[k] !== "") return row[k];
  return "";
}
