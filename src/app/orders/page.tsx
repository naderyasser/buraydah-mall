import OrdersView from "./OrdersView";

export const metadata = { title: "طلباتي", robots: { index: false } };

export default function OrdersPage() {
  return (
    <div className="wrap" style={{ maxWidth: 800 }}>
      <section className="section" style={{ paddingTop: 30 }}>
        <h1>طلباتي</h1>
        <p style={{ color: "var(--mut)", maxWidth: "58ch" }}>
          الطلبات التي أرسلتها من هذا الجهاز — بلا حساب ولا تسجيل. لو طلبت من جهاز آخر
          فتابعه من <a href="/track">تتبّع الطلب</a> برقم الطلب وجوالك.
        </p>
      </section>
      <OrdersView />
    </div>
  );
}
