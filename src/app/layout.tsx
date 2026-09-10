import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import CartBar from "@/components/CartBar";
import VisitBeacon from "@/components/VisitBeacon";
import { getWings } from "@/lib/queries";

export const metadata: Metadata = {
  title: { default: "مول بريدة — تسوّق من محلات بريدة في سلة واحدة", template: "%s — مول بريدة" },
  description:
    "منتجات محلات بريدة: ذهب وساعات وحقائب وأقمشة وفساتين. اطلب من أكثر من محل في طلب واحد، والاستلام من المحل أو التوصيل داخل بريدة.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const demo = process.env.NEXT_PUBLIC_DEMO_BANNER === "1";
  const wings = await getWings();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
        />
      </head>
      <body>
        <CartProvider>
          {demo && (
            <div className="demo-strip">
              نسخة تجريبية — المحلات والمنتجات والأسعار المعروضة أمثلة توضيحية وليست حقيقية
            </div>
          )}
          <div className="topstrip">
            التوصيل داخل بريدة · الدفع عند الاستلام · {wings.length} أقسام في مكان واحد
          </div>
          <Header />
          <CategoryBar />
          <main>{children}</main>
          <footer className="site-foot">
            <div className="wrap">
              <div className="cols">
                <div>
                  <h4>مول بريدة</h4>
                  <p style={{ margin: 0 }}>
                    محلات مدينة بريدة في واجهة واحدة. تختار من أكثر من محل، وتصلك
                    الطلبات مرتّبة على أصحابها.
                  </p>
                </div>
                <div>
                  <h4>الأجنحة</h4>
                  {wings.map((w) => (
                    <div key={w.slug}><Link href={`/wing/${w.slug}`}>{w.name_ar}</Link></div>
                  ))}
                </div>
                <div>
                  <h4>للتجار</h4>
                  <div><Link href="/join">انضم إلى المول</Link></div>
                  <div><Link href="/search">ابحث عن محل</Link></div>
                </div>
              </div>
              <p className="legal">
                مول بريدة دليل ومنصّة طلبات مستقلة. كل الأسماء والشعارات ملك أصحابها،
                والبيع والتسليم مسؤولية المحل صاحب المنتج. لإزالة محل أو تصحيح بياناته
                راسلنا من صفحة الانضمام.
              </p>
            </div>
          </footer>
          <CartBar />
          <VisitBeacon />
        </CartProvider>
      </body>
    </html>
  );
}
