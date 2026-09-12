import { NextRequest, NextResponse } from "next/server";
import { q } from "@/db";

export const dynamic = "force-dynamic";
const BOT = /bot|crawler|spider|crawling|preview|monitor|curl|wget|headless|lighthouse/i;

/** عدّاد ظهور يومي لكل حجز — ما يُطالَب به المعلن يجب أن يكون قابلاً للإثبات */
export async function POST(req: NextRequest) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true, counted: false });
  let ids: number[] = [];
  try { const b = await req.json(); ids = (Array.isArray(b?.ids) ? b.ids : []).map(Number).filter((n: number) => Number.isInteger(n) && n > 0).slice(0, 60); } catch {}
  if (ids.length === 0) return NextResponse.json({ ok: true, counted: false });
  try {
    await q(
      `INSERT INTO ad_impressions (placement_id, day, n)
       SELECT id, current_date, 1 FROM ad_placements WHERE id = ANY($1)
       ON CONFLICT (placement_id, day) DO UPDATE SET n = ad_impressions.n + 1`, [ids]);
  } catch (e) { console.error("[ad-impression]", e); }
  return NextResponse.json({ ok: true, counted: true });
}
