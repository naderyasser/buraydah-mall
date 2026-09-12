import { NextResponse } from "next/server";
import { q, q1 } from "@/db";
import { OCCASION_TAG } from "@/lib/saudi";

export const dynamic = "force-dynamic";

/**
 * فحص صحة حقيقي: يلمس قاعدة البيانات فعلاً. الفحص الذي يعيد ok دائماً
 * لا يكشف الحالة التي تُسقط الموقع فعلاً — قاعدة لا تستجيب.
 */
export async function GET() {
  const started = Date.now();
  try {
    const row = await q1<{ n: number }>(`SELECT count(*)::int AS n FROM wings WHERE is_active`);
    // كنس العروض المنتهية: يعود السعر إلى ما قبل الخصم ويسقط وسم المناسبة.
    // الفحص يُستدعى كل ٥ دقائق من cron، فهذا أرخص مكان لمهمّة دورية بلا عامل مستقل.
    const swept = await q<{ id: number }>(
      `UPDATE products SET price = compare_price, compare_price = NULL, sale_ends_at = NULL,
              tags = array_remove(tags, $1)
       WHERE sale_ends_at IS NOT NULL AND sale_ends_at < now() AND compare_price IS NOT NULL AND compare_price > price
       RETURNING id`, [OCCASION_TAG]
    );
    const expired = await q(`UPDATE products SET sale_ends_at = NULL, tags = array_remove(tags, $1)
                             WHERE sale_ends_at IS NOT NULL AND sale_ends_at < now() RETURNING id`, [OCCASION_TAG]);
    return NextResponse.json(
      { ok: true, db: "up", wings: row?.n ?? 0, swept: swept.length + expired.length, ms: Date.now() - started },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (err) {
    console.error("[health] db down", err);
    return NextResponse.json(
      { ok: false, db: "down", ms: Date.now() - started },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
