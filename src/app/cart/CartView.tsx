"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { sar } from "@/lib/money";

export default function CartView() {
  const { items, total, count, setQty, remove, byStore, ready } = useCart();

  if (!ready) return <div className="wrap" style={{ padding: "48px 0" }} />;

  if (count === 0) {
    return (
      <div className="wrap" style={{ paddingTop: 34 }}>
        <div className="empty">
          <h3>سلتك فارغة</h3>
          <p>تصفّح الأجنحة وأضف ما يعجبك — تقدر تجمع من أكثر من محل في طلب واحد.</p>
          <Link href="/" className="btn btn-gold" style={{ marginTop: 14 }}>ابدأ التصفّح</Link>
        </div>
      </div>
    );
  }

  const groups = byStore();

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ السلة</nav>
      <div className="checkout-grid">
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>سلتك</h1>
          <p style={{ color: "var(--text-2)", marginTop: 0 }}>
            {count} قطعة من {groups.length} {groups.length === 1 ? "محل" : "محلات"}.
          </p>

          {groups.map((g) => (
            <div className="shop-group" key={g.storeId}>
              <header>
                <Link href={`/store/${g.storeSlug}`}>{g.storeName}</Link>
                <span className="badge gold tabular">{sar(g.subtotal)} ر.س</span>
              </header>
              {g.items.map((it) => (
                <div className="cart-line" key={it.productId}>
                  {it.image ? <img src={it.image} alt={it.name} /> : <div style={{ width: 72, height: 72, background: "var(--sunk)", borderRadius: 3 }} />}
                  <div className="info">
                    <h4><Link href={`/product/${it.slug}`}>{it.name}</Link></h4>
                    <small className="tabular">{sar(it.price)} ر.س {it.unit ?? ""}</small>
                    <div className="qty" style={{ marginTop: 8 }}>
                      <button type="button" onClick={() => setQty(it.productId, it.qty - 1)} aria-label="أنقص">−</button>
                      <span className="tabular">{it.qty}</span>
                      <button type="button" onClick={() => setQty(it.productId, it.qty + 1)} aria-label="زد">+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "end", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="amt tabular">{sar(it.qty * it.price)}</span>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => remove(it.productId)}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <aside className="totals">
          <div className="row"><span>عدد القطع</span><b className="tabular">{count}</b></div>
          <div className="row"><span>عدد المحلات</span><b className="tabular">{groups.length}</b></div>
          <div className="row grand"><span>الإجمالي</span><b className="tabular">{sar(total)} ر.س</b></div>
          <Link href="/checkout" className="btn btn-gold btn-block" style={{ marginTop: 14 }}>متابعة الطلب</Link>
          <p className="hint" style={{ marginTop: 12 }}>
            لا دفع إلكتروني — تدفع عند الاستلام أو مع المحل. سنؤكّد طلبك بالجوال.
          </p>
        </aside>
      </div>
    </div>
  );
}
