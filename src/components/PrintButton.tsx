"use client";
/** إيصال للطباعة (جرير/نون): نفس الصفحة بورقة نظيفة عبر CSS للطباعة، بلا صفحة مستقلة */
export default function PrintButton() {
  return (
    <button type="button" className="btn btn-line no-print" onClick={() => window.print()}>
      طباعة الإيصال
    </button>
  );
}
