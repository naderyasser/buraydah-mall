/** هيكل تحميل بدل شاشة بيضاء — يشعر الزائر أن الصفحة تستجيب حتى قبل وصول النتائج */
export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="skel" style={{ height: 34, width: 260, margin: "26px 0 18px" }} />
      <div className="grid">
        {Array.from({ length: 8 }).map((_, i) => <div className="skel" key={i} style={{ height: 320 }} />)}
      </div>
    </div>
  );
}
