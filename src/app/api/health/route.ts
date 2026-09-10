import { NextResponse } from "next/server";
import { q1 } from "@/db";

export const dynamic = "force-dynamic";

/**
 * فحص صحة حقيقي: يلمس قاعدة البيانات فعلاً. الفحص الذي يعيد ok دائماً
 * لا يكشف الحالة التي تُسقط الموقع فعلاً — قاعدة لا تستجيب.
 */
export async function GET() {
  const started = Date.now();
  try {
    const row = await q1<{ n: number }>(`SELECT count(*)::int AS n FROM wings WHERE is_active`);
    return NextResponse.json(
      { ok: true, db: "up", wings: row?.n ?? 0, ms: Date.now() - started },
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
