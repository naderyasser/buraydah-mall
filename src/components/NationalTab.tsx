import Link from "next/link";
import { currentOccasion, upcomingOccasion, occasionStart } from "@/lib/saudi";
import { mallMode } from "@/lib/ads";

/** شعار صغير ثابت على جانب الشاشة يذكّر باليوم الوطني في كل الصفحات — لا يزاحم المحتوى */
export default async function NationalTab() {
  const now = new Date();
  const directory = (await mallMode()) === "directory";
  const occ = currentOccasion(now);
  const soon = occ ? null : upcomingOccasion(now);
  const o = occ ?? soon;
  if (!o || o.key !== "national" || (soon && soon.days > 20)) return null;
  return (
    <Link href={directory ? "/stores" : "/national-day"} className="nd-tab no-print" aria-label="اليوم الوطني 96">
      <span className="nd-tab-num tabular">96</span>
      <span className="nd-tab-txt">{directory ? (occ ? "كل عام والوطن بخير" : `اليوم الوطني بعد ${soon!.days} يوماً`) : occ ? "عروض اليوم الوطني" : `عروض اليوم الوطني تبدأ بعد ${Math.max(1, Math.ceil(((occasionStart(now)?.getTime() ?? 0) - now.getTime()) / 864e5))} أيام`}</span>
    </Link>
  );
}
