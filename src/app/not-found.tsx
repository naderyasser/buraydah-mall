import Link from "next/link";

export const metadata = { title: "الصفحة غير موجودة" };

export default function NotFound() {
  return (
    <div className="wrap" style={{ maxWidth: 620 }}>
      <div className="empty" style={{ marginTop: 60 }}>
        <h3>لم نجد هذه الصفحة</h3>
        <p>
          قد يكون المنتج بيع أو أُخفي، أو المحل لم يعد في المول. جرّب البحث أو
          تصفّح الأقسام من الرئيسية.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <Link className="btn btn-gold" href="/">الرئيسية</Link>
          <Link className="btn btn-line" href="/search?q=%D8%A7%D9%84%D9%83%D9%84">تصفّح كل المنتجات</Link>
          <Link className="btn btn-line" href="/requests">اطلب ما لا تجده</Link>
        </div>
      </div>
    </div>
  );
}
