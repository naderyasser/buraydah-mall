import Link from "next/link";
import Countdown from "./Countdown";
import Skyline from "./Skyline";
import { currentOccasion, upcomingOccasion, occasionEnd, occasionStart } from "@/lib/saudi";

/**
 * لافتة حملة اليوم الوطني ٩٦ — كإعلان مصمَّم لا كبطاقة واجهة: ثلاث مناطق
 * (النصّ يميناً، «٩٦» ذهبية في الوسط فوق أفق بريدة، والعدّ التنازلي يساراً)
 * على خلفية زمرّدية متعدّدة الطبقات بإطار ذهبي رفيع. البيانات والروابط والعدّ
 * كما كانت؛ التغيير في العرض فقط. لا صور أشخاص — أفق وصور ظلّية فقط.
 */
export default function NationalBanner() {
  const now = new Date();
  const occ = currentOccasion(now);
  const soon = occ ? null : upcomingOccasion(now);
  const key = (occ ?? soon)?.key;
  if (key !== "national" || (!occ && soon!.days > 20)) return null;
  const win = occasionEnd(now);
  const to = occ ? win?.ends : occasionStart(now);
  if (!to) return null;
  return (
    <section className="ndx-wrap" aria-labelledby="ndx-title">
      <Link href="/national-day" className="ndx" aria-describedby="ndx-sub">
        <span className="ndx-bg" aria-hidden="true" />
        <span className="ndx-glow" aria-hidden="true" />
        <span className="ndx-vignette" aria-hidden="true" />
        <span className="ndx-orn ndx-orn-s" aria-hidden="true" />
        <span className="ndx-orn ndx-orn-e" aria-hidden="true" />

        {/* ١) النصّ الترويجي — يمين */}
        <div className="ndx-text">
          <span className="ndx-badge">عزّنا بطبعنا</span>
          <h2 id="ndx-title" className="ndx-h">عروض اليوم الوطني <b className="ndx-h96 tabular">96</b></h2>
          <p id="ndx-sub" className="ndx-sub">
            {occ ? "خصومات محلات بريدة سارية — تنتهي خلال:" : "جهّز سلتك! خصومات مول بريدة الكبرى تنطلق خلال:"}
          </p>
          <span className="ndx-rule" aria-hidden="true" />
        </div>

        {/* ٢) المشهد — وسط: أفق بريدة ونخيل خلف «٩٦» ذهبية */}
        <div className="ndx-hero" aria-hidden="true">
          <Skyline className="ndx-sky" height={110} />
          <span className="ndx-cal">اليوم الوطني السعودي</span>
          <span className="ndx-96">96</span>
        </div>

        {/* ٣) العدّ التنازلي — يسار */}
        <div className="ndx-count">
          <Countdown to={to.toISOString()} label={occ ? "المتبقّي على نهاية العروض" : "المتبقّي على بداية العروض"} boxes />
        </div>
      </Link>
    </section>
  );
}
