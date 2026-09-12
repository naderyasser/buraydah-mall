import { q } from "@/db";
import { getSetting, getSettings } from "@/lib/settings";

/** أحجام المساحات الإعلانية كما يبيعها المول */
export const AD_SIZES = [
  { key: "full",    name: "صفحة كاملة",  desc: "لافتة عريضة بصورة إعلانية ونبذة وزر — أول ما يراه الزائر", slotsHome: 1 },
  { key: "half",    name: "نصف صفحة",    desc: "لافتة بنصف العرض بصورة وشعار ونبذة قصيرة",                 slotsHome: 2 },
  { key: "quarter", name: "ربع صفحة",    desc: "بطاقة بشعار ونبذة من سطر وزر زيارة",                       slotsHome: 4 },
  { key: "small",   name: "خانة صغيرة",  desc: "شعار الماركة في دائرة/مربّع يفتح موقعها مباشرة",             slotsHome: 24 },
] as const;
export type AdSize = (typeof AD_SIZES)[number]["key"];

export type Placement = {
  id: number; space_id: number; size: AdSize; position: number; zone: string;
  store_id: number; slug: string; name_ar: string; logo_path: string | null; summary_ar: string | null;
  dest_type: string; dest_value: string; district: string | null; wing_slug: string; wing_name: string;
  headline: string | null; image_path: string | null; ends_on: string;
  sample_images: string[];
};

/** «دليل إعلاني» (الافتراضي بطلب العميل) أو «متجر» — يُبدَّل من الإعدادات بلا نشر */
export async function mallMode(): Promise<"directory" | "shop"> {
  const v = await getSetting("mall_mode").catch(() => "directory");
  return v === "shop" ? "shop" : "directory";
}

export async function adPrices(): Promise<Record<AdSize, number>> {
  const s = await getSettings(["ad_price_full", "ad_price_half", "ad_price_quarter", "ad_price_small"]);
  return { full: Number(s.ad_price_full) || 0, half: Number(s.ad_price_half) || 0, quarter: Number(s.ad_price_quarter) || 0, small: Number(s.ad_price_small) || 0 };
}

/**
 * الحجوزات الحيّة في منطقة (الرئيسية أو قطاع) مع بيانات الماركة وصورتين عيّنة.
 * الحجز يُعرض فقط ضمن مدّته وبحالة active — الماركة بلا اشتراك لا تظهر في المساحات.
 */
export async function getLivePlacements(zone: string): Promise<Placement[]> {
  return q<Placement>(
    `SELECT p.id, p.space_id, sp.size, sp.position, sp.zone, p.store_id, s.slug, s.name_ar, s.logo_path, s.summary_ar,
            s.dest_type, s.dest_value, s.district, w.slug AS wing_slug, w.name_ar AS wing_name,
            p.headline, p.image_path, p.ends_on::text AS ends_on,
            coalesce((SELECT array_agg(pr.image_path ORDER BY pr.sort_order) FROM (
               SELECT image_path, sort_order FROM products WHERE store_id = s.id AND is_active AND image_path IS NOT NULL ORDER BY sort_order LIMIT 2) pr), '{}') AS sample_images
     FROM ad_placements p
     JOIN ad_spaces sp ON sp.id = p.space_id AND sp.is_active
     JOIN stores s ON s.id = p.store_id AND s.is_active
     JOIN wings w ON w.id = s.wing_id
     WHERE sp.zone = $1 AND p.status = 'active' AND p.starts_on <= current_date AND p.ends_on >= current_date
     ORDER BY sp.size, sp.position`,
    [zone]
  );
}

/** عدد الخانات الفارغة في منطقة — يُعرض للمعلن كـ«مساحة متاحة» */
export async function getSpaceCounts(zone: string) {
  return q<{ size: AdSize; total: number; taken: number }>(
    `SELECT sp.size, count(*)::int AS total,
            count(p.id)::int AS taken
     FROM ad_spaces sp
     LEFT JOIN ad_placements p ON p.space_id = sp.id AND p.status = 'active' AND p.starts_on <= current_date AND p.ends_on >= current_date
     WHERE sp.zone = $1 AND sp.is_active GROUP BY sp.size`,
    [zone]
  );
}
