import Link from "next/link";
import Countdown from "./Countdown";
import { currentOccasion, upcomingOccasion, occasionEnd, occasionStart } from "@/lib/saudi";

/**
 * لافتة اليوم الوطني ٩٦ بهوية «عزّنا بطبعنا»: أخضر داكن، إطار منقّط كالسدو،
 * وأربعة صناديق زجاجية للعدّ التنازلي. قبل ١٥ سبتمبر تعدّ للبداية، وبعدها للنهاية.
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
    <Link href="/national-day" className="nd-banner" aria-label="عروض اليوم الوطني 96">
      <div className="nd-b-text">
        <span className="nd-frame">عزّنا بطبعنا</span>
        <h2>🇸🇦 عروض اليوم الوطني 96</h2>
        <p>{occ ? "خصومات محلات بريدة سارية — تنتهي خلال:" : "جهّز سلتك! خصومات مول بريدة الكبرى تنطلق خلال:"}</p>
      </div>
      <Countdown to={to.toISOString()} label={occ ? "المتبقّي على نهاية العروض" : "المتبقّي على بداية العروض"} boxes />
      <span className="nd-96" aria-hidden="true">96</span>
      <svg className="nd-palm" viewBox="0 0 64 80" aria-hidden="true" fill="currentColor">
        <path d="M32 80V38" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M32 40c-9-15-25-19-38-15 13 2 25 8 38 15Zm0 0c9-15 25-19 38-15-13 2-25 8-38 15Zm0-4c-13-8-19-22-13-34 4 12 9 22 13 34Zm0 0c13-8 19-22 13-34-4 12-9 22-13 34Zm0 6c-16-2-30 6-34 18 10-6 22-12 34-18Zm0 0c16-2 30 6 34 18-10-6-22-12-34-18Z" />
      </svg>
    </Link>
  );
}
