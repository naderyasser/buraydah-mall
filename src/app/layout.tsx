import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import CartBar from "@/components/CartBar";
import BottomNav from "@/components/BottomNav";
import VisitBeacon from "@/components/VisitBeacon";
import { getWings } from "@/lib/queries";
import { getTrendingSearches } from "@/lib/browse";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const DESCRIPTION =
  "منتجات محلات بريدة: ذهب وساعات وحقائب وأقمشة وفساتين. اطلب من أكثر من محل في طلب واحد، والاستلام من المحل أو التوصيل داخل بريدة.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "مول بريدة — تسوّق من محلات بريدة في سلة واحدة", template: "%s — مول بريدة" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "ar_SA", siteName: SITE_NAME,
    title: "مول بريدة — تسوّق من محلات بريدة في سلة واحدة",
    description: DESCRIPTION, url: SITE_URL,
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: "#0B7A4B" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const demo = process.env.NEXT_PUBLIC_DEMO_BANNER === "1";
  const [wings, trending] = await Promise.all([getWings(), getTrendingSearches(6).catch(() => [])]);

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
              نسخة تجريبية — المحلات والمنتجات والأسعار والتقييمات المعروضة كلها أمثلة توضيحية وليست حقيقية
            </div>
          )}
          <div className="topstrip">
            التوصيل داخل بريدة · الدفع عند الاستلام بدون رسوم · استرجاع خلال ٧ أيام
          </div>
          <Header trending={trending.map((t) => t.term)} />
          <CategoryBar wings={wings} />
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
                  <div><Link href="/merchant">بوابة التاجر</Link></div>
                  <div><Link href="/stores">دليل المحلات</Link></div>
                </div>
                <div>
                  <h4>خدمة العملاء</h4>
                  <div><Link href="/orders">طلباتي</Link></div>
                  <div><Link href="/track">تتبّع طلبك</Link></div>
                  <div><Link href="/requests">اطلب ما لا تجده</Link></div>
                  <div><Link href="/returns">الاستبدال والاسترجاع</Link></div>
                  <div><Link href="/terms">الشروط والأحكام</Link></div>
                  <div><Link href="/privacy">سياسة الخصوصية</Link></div>
                </div>
              </div>
              <p className="legal">
                مول بريدة منصّة وسيطة مستقلة تعرض منتجات محلات المدينة وتوزّع الطلب
                على أصحابه؛ البيع والتسليم والفاتورة مسؤولية المحل صاحب المنتج.
                الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة، ولا توجد رسوم
                مخفية. كل الأسماء والشعارات ملك أصحابها. لإزالة محل أو تصحيح بياناته
                راسلنا من صفحة الانضمام.
              </p>
            </div>
          </footer>
          <CartBar />
          <BottomNav />
          <VisitBeacon />
        </CartProvider>
      </body>
    </html>
  );
}
