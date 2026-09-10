/** نجوم التقييم — تُقرأ بلمحة، والرقم بجانبها لمن يريد الدقّة */
export default function Stars({ value, count, size = 14 }: { value?: number | string | null; count?: number; size?: number }) {
  const v = value == null ? 0 : Number(value);
  if (!v) return null;
  const full = Math.round(v);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`التقييم ${v} من 5`}>
      <span className="stars-ico">{"★★★★★".slice(0, full)}<span className="off">{"★★★★★".slice(full)}</span></span>
      <b className="tabular">{v}</b>
      {count != null && count > 0 && <small className="tabular">({count})</small>}
    </span>
  );
}
