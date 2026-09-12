import Link from "next/link";
import Countdown from "./Countdown";
import Skyline from "./Skyline";
import { RiderFlag, Palms, PalmShield } from "./NationalArt";
import { currentOccasion, upcomingOccasion, occasionEnd, occasionStart } from "@/lib/saudi";
import { mallMode } from "@/lib/ads";
import { existsSync } from "node:fs";
import path from "node:path";

/** خلفية الحملة المرسومة (يرفعها العميل في public/) — إن وُجدت تحلّ محلّ المشهد المرسوم بـSVG */
const ART = ["national-bg.webp", "national-bg.jpg", "national-bg.png"].find((f) => existsSync(path.join(process.cwd(), "public", f)));

/**
 * لافتة حملة اليوم الوطني ٩٦ — ترجمة للتصميم المرجعي: عدّ تنازلي يساراً، مشهد
 * تراثي (فارس بعلم، قلعة نجدية، نخيل) يذوب في الخلفية، «٩٦» ذهبية ضخمة في
 * الوسط تحت الخطّ، والنصّ الترويجي يميناً بشارة ودرع بنخلة. البيانات والعدّ
 * والرابط كما هي؛ كل الرسوم CSS/SVG بلا صور أشخاص حقيقية ولا شعار الدولة.
 */
export default async function NationalBanner() {
  const now = new Date();
  const directory = (await mallMode()) === "directory";
  const occ = currentOccasion(now);
  const soon = occ ? null : upcomingOccasion(now);
  const key = (occ ?? soon)?.key;
  if (key !== "national" || (!occ && soon!.days > 20)) return null;
  const win = occasionEnd(now);
  const to = directory ? new Date(now.getTime() + (occ ? 0 : (soon?.days ?? 0)) * 864e5) : (occ ? win?.ends : occasionStart(now));
  if (!to) return null;
  const dayTarget = directory ? new Date(`${new Date(now.getTime() + (soon?.days ?? 0) * 864e5).toLocaleDateString("sv-SE", { timeZone: "Asia/Riyadh" })}T00:00:00+03:00`) : to;
  return (
    <section className="ndx-wrap" aria-labelledby="ndx-title">
      <Link href={directory ? "/stores" : "/national-day"} className="ndx" aria-describedby="ndx-sub">
        {/* طبقات الخلفية */}
        <span className="ndx-bg" aria-hidden="true" />
        <span className="ndx-haze" aria-hidden="true" />
        <span className="ndx-dust" aria-hidden="true" />
        <span className="ndx-vignette" aria-hidden="true" />
        <span className="ndx-orn ndx-orn-e" aria-hidden="true" />
        <span className="ndx-orn2 ndx-orn2-s" aria-hidden="true" />

        {/* المشهد التراثي: خلفية الحملة إن رُفعت، وإلا نخيل وقلعة وفارس بعلم مرسومة */}
        {ART ? (
          <span className="ndx-art" style={{ backgroundImage: `url(/${ART})` }} aria-hidden="true" />
        ) : (
          <div className="ndx-scene" aria-hidden="true">
            <span className="ndx-fort" />
            <Palms className="ndx-palms" />
            <Skyline className="ndx-sky" height={120} />
            <RiderFlag className="ndx-rider" />
          </div>
        )}

        {/* النصّ الترويجي — يمين */}
        <div className="ndx-text">
          <span className="ndx-badge">عزّنا بطبعنا</span>
          <h2 id="ndx-title" className="ndx-h">{directory ? <>اليوم الوطني السعودي <b className="ndx-h96 tabular">96</b></> : <>عروض اليوم الوطني <b className="ndx-h96 tabular">96</b></>}</h2>
          <p id="ndx-sub" className="ndx-sub">
            {directory
              ? (occ ? "كل عام والوطن بخير — ماركات بريدة تحتفل معكم" : "كل عام والوطن بخير — يبقى على اليوم الوطني:")
              : (occ ? "خصومات محلات بريدة سارية — تنتهي خلال:" : "جهّز سلتك! خصومات مول بريدة الكبرى تنطلق خلال:")}
          </p>
          <span className="ndx-rule" aria-hidden="true" />
          <PalmShield className="ndx-shield" />
        </div>

        {/* «٩٦» البطلة — وسط */}
        <div className="ndx-hero" aria-hidden="true">
          <span className="ndx-cal">اليوم الوطني السعودي</span>
          <span className="ndx-96">96</span>
          <span className="ndx-dia ndx-dia-a" /><span className="ndx-dia ndx-dia-b" /><span className="ndx-dia ndx-dia-c" />
        </div>

        {/* العدّ التنازلي — يسار */}
        <div className="ndx-count">
          {directory && occ ? null : <Countdown to={(directory ? dayTarget : to).toISOString()} label={directory ? "المتبقّي على اليوم الوطني" : occ ? "المتبقّي على نهاية العروض" : "المتبقّي على بداية العروض"} boxes />}
        </div>
      </Link>
    </section>
  );
}
