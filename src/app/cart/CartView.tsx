"use client";
import Link from "next/link";
import Riyal from "@/components/Riyal";
import { useEffect, useState } from "react";
import { useCart, keyOf } from "@/lib/cart";
import { sar } from "@/lib/money";
import FreeDeliveryBar from "@/components/FreeDeliveryBar";
import { deliveryInfo } from "./actions";

export default function CartView() {
  const { items, total, count, setQty, remove, byStore, ready } = useCart();
  const [delivery, setDelivery] = useState<Record<number, { fee: number; freeOver: number | null }>>({});

  const storeKey = items.map((i) => i.storeId).sort().join(",");
  useEffect(() => {
    const ids = [...new Set(items.map((i) => i.storeId))];
    if (!ids.length) return;
    deliveryInfo(ids)
      .then((rows) => setDelivery(Object.fromEntries(rows.map((r) => [
        r.id, { fee: Number(r.delivery_fee), freeOver: r.free_delivery_over == null ? null : Number(r.free_delivery_over) },
      ]))))
      .catch(() => {});
  }, [storeKey]);

  if (!ready) return <div className="wrap" style={{ padding: "48px 0" }} />;

  if (count === 0) {
    return (
      <div className="wrap" style={{ paddingTop: 34 }}>
        <div className="empty">
          <h3>سلة التسوق فارغة</h3>
          <p>تصفّح الأقسام وأضف ما يعجبك — تقدر تجمع من أكثر من محل في طلب واحد.</p>
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
          <p style={{ color: "var(--mut)", marginTop: 0 }}>
            {count} قطعة من {groups.length} {groups.length === 1 ? "محل" : "محلات"} — كل محل يجهّز نصيبه.
          </p>

          {groups.map((g) => (
            <div className="shop-group" key={g.storeId}>
              <header>
                <Link href={`/store/${g.storeSlug}`}>{g.storeName}</Link>
                <span className="badge gold tabular">{sar(g.subtotal)} <Riyal /></span>
              </header>
              {delivery[g.storeId] && (
                <FreeDeliveryBar
                  subtotal={g.subtotal}
                  freeOver={delivery[g.storeId].freeOver}
                  fee={delivery[g.storeId].fee}
                  storeName={g.storeName}
                />
              )}
              {g.items.map((it) => (
                <div className="cart-line" key={keyOf(it)}>
                  {it.image ? <img src={it.image} alt={it.name} />
                            : <div className="cart-ph" />}
                  <div className="info">
                    <h4><Link href={`/product/${it.slug}`}>{it.name}</Link></h4>
                    {it.variantName && <span className="vtag">{it.variantName}</span>}
                    <small className="tabular">{sar(it.price)} <Riyal /> {it.unit ?? ""}</small>
                    <div className="qty" style={{ marginTop: 8 }}>
                      <button type="button" onClick={() => setQty(keyOf(it), it.qty - 1)} aria-label="أنقص">−</button>
                      <span className="tabular">{it.qty}</span>
                      <button type="button" onClick={() => setQty(keyOf(it), it.qty + 1)} aria-label="زد">+</button>
                    </div>
                  </div>
                  <div className="cart-side">
                    <span className="amt tabular">{sar(it.qty * it.price)}</span>
                    <button type="button" className="btn btn-line btn-sm" onClick={() => remove(keyOf(it))}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <aside className="totals">
          <div className="row"><span>عدد القطع</span><b className="tabular">{count}</b></div>
          <div className="row"><span>عدد المحلات</span><b className="tabular">{groups.length}</b></div>
          <div className="row grand"><span>الإجمالي</span><b className="tabular">{sar(total)} <Riyal /></b></div>
          <Link href="/checkout" className="btn btn-gold btn-block" style={{ marginTop: 14 }}>متابعة الطلب</Link>
          <p className="hint" style={{ marginTop: 12 }}>
            الأسعار شاملة ضريبة القيمة المضافة · لا دفع إلكتروني — تدفع عند الاستلام.
          </p>
        </aside>
      </div>
    </div>
  );
}
