const STEPS = [
  { key: "new", label: "قيد المراجعة" },
  { key: "confirmed", label: "أكّده المحل" },
  { key: "done", label: "تم التسليم" },
];

/** خط حالة لكل محل على حدة — الطلب الواحد قد يكون جاهزاً عند محل ومتأخراً عند آخر */
export default function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return <span className="badge st-cancelled">ملغى</span>;
  }
  const at = Math.max(0, STEPS.findIndex((s) => s.key === status));
  return (
    <ol className="timeline">
      {STEPS.map((s, i) => (
        <li key={s.key} className={i <= at ? "on" : ""}>
          <span className="dot" />{s.label}
        </li>
      ))}
    </ol>
  );
}
