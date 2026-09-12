import Link from "next/link";
import Riyal from "@/components/Riyal";
import type { Metadata } from "next";
import { q } from "@/db";
import { getWings } from "@/lib/queries";
import { agoAr } from "@/lib/time";
import { sar } from "@/lib/money";
import RequestForm from "./RequestForm";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "اطلب ما لا تجده — طلبات الشراء",
  description:
    "اكتب ما تبحث عنه في بريدة وتصلك عروض المحلات على جوالك. مجاناً وبلا حساب.",
  alternates: { canonical: `${SITE_URL}/requests` },
};

export default async function RequestsPage() {
  const [rows, wings] = await Promise.all([
    q<any>(
      `SELECT r.id, r.title, r.body, r.budget_max, r.district, r.created_at,
              w.name_ar AS wing, w.slug AS wing_slug,
              (SELECT count(*)::int FROM buy_offers o WHERE o.request_id = r.id) AS offers
       FROM buy_requests r LEFT JOIN wings w ON w.id = r.wing_id
       WHERE r.status = 'open' AND r.expires_on >= current_date
       ORDER BY r.created_at DESC LIMIT 60`
    ),
    getWings(),
  ]);

  return (
    <div className="wrap">
      <nav className="crumbs"><Link href="/">الرئيسية</Link> ‹ طلبات الشراء</nav>

      <section className="section" style={{ paddingTop: 18, paddingBottom: 10 }}>
        <h1 style={{ fontSize: "clamp(24px,4vw,34px)" }}>اطلب ما لا تجده</h1>
        <p style={{ color: "var(--mut)", maxWidth: "62ch" }}>
          ما لقيت اللي تبيه في المول؟ اكتبه هنا، ومحلات بريدة تعرض عليك.
          مجاناً وبلا حساب — رقمك يصل المحلات فقط ولا يظهر في الصفحة.
        </p>
      </section>

      <div className="req-layout">
        <RequestForm wings={wings} />

        <div>
          <div className="section-head">
            <h2>طلبات مفتوحة</h2>
            <span className="tabular">{rows.length}</span>
          </div>

          {rows.length === 0 ? (
            <div className="empty">
              <h3>لا طلبات مفتوحة الآن</h3>
              <p>كن أول من يطلب — المحلات تتابع هذه الصفحة.</p>
            </div>
          ) : (
            <div className="req-list">
              {rows.map((r: any) => (
                <article className="req" key={r.id}>
                  <header>
                    <h3>{r.title}</h3>
                    {r.budget_max && (
                      <span className="badge gold tabular">حتى {sar(r.budget_max)} <Riyal /></span>
                    )}
                  </header>
                  {r.body && <p>{r.body}</p>}
                  <footer>
                    {r.wing && <Link href={`/wing/${r.wing_slug}`}>{r.wing}</Link>}
                    {r.district && <span>حي {r.district}</span>}
                    <span className="hint">{agoAr(r.created_at)}</span>
                    <span className={`badge ${r.offers > 0 ? "open" : "st-new"}`}>
                      {r.offers > 0 ? `${r.offers} عرضاً` : "بانتظار العروض"}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
