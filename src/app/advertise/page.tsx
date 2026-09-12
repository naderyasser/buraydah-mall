import Link from "next/link";
import type { Metadata } from "next";
import Riyal from "@/components/Riyal";
import AdRequestForm from "./AdRequestForm";
import { AD_SIZES, adPrices, getSpaceCounts } from "@/lib/ads";
import { getSetting } from "@/lib/settings";
import { getWings } from "@/lib/queries";
import { sar } from "@/lib/money";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "أعلن معنا — مساحات إعلانية في مول بريدة",
  description: "احجز مساحة لماركتك في مول بريدة الإلكتروني: صفحة كاملة، نصف، ربع، أو خانة صغيرة بالاشتراك الشهري.",
  alternates: { canonical: `${SITE_URL}/advertise` },
};

/** صفحة المعلن: الأحجام والأسعار والمساحات المتاحة الآن، ونموذج حجز يصل للإدارة */
export default async function Advertise({ searchParams }: { searchParams: Promise<{ size?: string }> }) {
  const sp = await searchParams;
  const [prices, counts, bank, wings] = await Promise.all([adPrices(), getSpaceCounts("home"), getSetting("ad_bank_note"), getWings()]);
  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ أعلن معنا</nav>
      <section className="section" style={{ paddingTop: 18 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,34px)" }}>أعلن في مول بريدة</h1>
        <p style={{ color: "var(--mut)", maxWidth: "64ch", marginTop: 10 }}>
          المول واجهة مدينة بريدة على الإنترنت: الزائر يرى ماركتك في مساحتها، ويضغط فينتقل مباشرة إلى موقعك أو حسابك
          الرسمي ليشتري منك. أنت تدفع اشتراكاً شهرياً للمساحة — لا عمولة على مبيعاتك ولا وسيط بينك وبين عميلك.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><h2>الأحجام والأسعار</h2><span>الأسعار شهرية شاملة الضريبة</span></div>
        <div className="ad-plans">
          {AD_SIZES.map((s) => {
            const c = counts.find((x) => x.size === s.key); const free = c ? c.total - c.taken : 0;
            return (
              <div key={s.key} className={`ad-plan ad-plan-${s.key}${sp.size === s.key ? " on" : ""}`}>
                <b>{s.name}</b>
                <span className="ad-plan-price tabular">{sar(prices[s.key])} <Riyal /><small>/ شهر</small></span>
                <p>{s.desc}</p>
                <small className="ad-plan-free">{free > 0 ? `${free} متاحة الآن في الرئيسية` : "الرئيسية مكتملة — متاحة في صفحات القطاعات"}</small>
              </div>
            );
          })}
        </div>
        <p className="hint" style={{ marginTop: 10 }}>لكل قطاع (الذهب، المطاعم، الصيدليات…) مساحاته الخاصة بنصف السعر تقريباً — اسأل عنها في الطلب.</p>
      </section>

      <section className="section">
        <div className="section-head"><h2>احجز مساحتك</h2></div>
        <AdRequestForm sizes={AD_SIZES.map((s) => ({ key: s.key, name: s.name }))} wings={wings.map((w) => ({ slug: w.slug, name_ar: w.name_ar }))} defaultSize={sp.size} />
        <div className="panel" style={{ marginTop: 14 }}>
          <b>الدفع والتفعيل:</b> {bank || "تحويل بنكي، ويُفعَّل الاشتراك خلال يوم عمل."} نرسل لك بيانات الحساب ورقم الفاتورة على واتساب بعد الاتفاق على المساحة والمدّة.
          <br /><span className="hint">الشعارات والعلامات ملك أصحابها ولا تُعرض إلا باشتراك من الماركة أو وكيلها المعتمد.</span>
        </div>
      </section>
    </div>
  );
}
