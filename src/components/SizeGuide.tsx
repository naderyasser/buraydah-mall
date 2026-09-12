/** دليل المقاسات كما يعرفه السوق السعودي: الثوب بالطول (٥٤–٦٠) والعباية بالطول بالسنتيمتر — يقلّل الإرجاع (نمشي) */
const GUIDES: Record<string, { title: string; head: string[]; rows: string[][]; note: string }> = {
  clothing: {
    title: "دليل مقاسات الثوب الرجالي",
    head: ["المقاس", "الطول (سم)", "يناسب طول الجسم"],
    rows: [["52", "142", "160–165"], ["54", "147", "165–170"], ["56", "152", "170–175"], ["58", "157", "175–180"], ["60", "162", "180–185"], ["62", "167", "185–190"]],
    note: "المقاس السعودي يُقاس بطول الثوب من الكتف إلى الأسفل. للأطفال: المقاس = العمر تقريباً (٤، ٦، ٨…).",
  },
  dresses: {
    title: "دليل مقاسات الفساتين والعبايات",
    head: ["المقاس", "الصدر (سم)", "الخصر (سم)", "طول العباية (سم)"],
    rows: [["S / 36", "84–88", "66–70", "52–54"], ["M / 38", "88–92", "70–74", "54–56"], ["L / 40", "92–96", "74–78", "56–58"], ["XL / 42", "96–102", "78–84", "58–60"], ["XXL / 44", "102–108", "84–90", "60–62"]],
    note: "طول العباية يُكتب بالبوصة عادةً (٥٢، ٥٤…) ويساوي طول الجسم ناقص ١٠ سم تقريباً. التفصيل بالمقاس متاح من أغلب المحلات.",
  },
};

export default function SizeGuide({ wing }: { wing: string }) {
  const g = GUIDES[wing];
  if (!g) return null;
  return (
    <details className="size-guide">
      <summary>{g.title}</summary>
      <div className="tablewrap">
        <table className="admin"><thead><tr>{g.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{g.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className="tabular">{c}</td>)}</tr>)}</tbody></table>
      </div>
      <p className="hint">{g.note}</p>
    </details>
  );
}
