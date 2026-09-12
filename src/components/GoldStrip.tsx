import Riyal from "./Riyal";
import { getSettings } from "@/lib/settings";
import { sar } from "@/lib/money";

/** سعر جرام الذهب اليوم كما تعلّقه محلات الذهب السعودية على الواجهة — من إعدادات الإدارة */
export default async function GoldStrip({ weight, karat }: { weight?: number | string | null; karat?: string | null } = {}) {
  const s = await getSettings(["gold_gram_24", "gold_gram_21", "gold_gram_18"]);
  const rows = [["24", s.gold_gram_24], ["21", s.gold_gram_21], ["18", s.gold_gram_18]].filter(([, v]) => v && Number(v) > 0) as [string, string][];
  if (rows.length === 0) return null;
  const k = karat && rows.find(([kk]) => karat.includes(kk)) ? rows.find(([kk]) => karat.includes(kk))![0] : "21";
  const gram = Number(rows.find(([kk]) => kk === k)?.[1] ?? 0);
  const w = Number(weight ?? 0);
  return (
    <div className="gold-strip">
      <span className="gs-h">سعر جرام الذهب اليوم:</span>
      {rows.map(([kk, v]) => <span key={kk} className={kk === k && w > 0 ? "on" : ""}>عيار {kk} <b className="tabular">{sar(v)}</b> <Riyal /></span>)}
      {w > 0 && gram > 0 && (
        <span className="gs-calc">الوزن <b className="tabular">{w}</b> جم × عيار {k} = <b className="tabular">{sar(w * gram)}</b> <Riyal /> قيمة الذهب الخام — الفرق مصنعية المحل</span>
      )}
    </div>
  );
}
