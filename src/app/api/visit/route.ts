import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { q } from "@/db";

export const dynamic = "force-dynamic";

const COOKIE = "mall_v";
const BOT = /bot|crawler|spider|crawling|preview|monitor|curl|wget|headless|lighthouse/i;

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return NextResponse.json({ ok: true, counted: false });

  const existing = req.cookies.get(COOKIE)?.value;
  if (existing) return NextResponse.json({ ok: true, counted: false });

  const session = randomUUID();
  // المسار يأتي من النافذة نفسها: الـreferer قد يكون فارغاً أو خارجياً
  let path: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path.slice(0, 200);
  } catch { /* بلا جسم — لا مسار */ }

  try {
    await q(
      `INSERT INTO visits (session_id, path, device, referrer) VALUES ($1,$2,$3,$4)
       ON CONFLICT (session_id) DO NOTHING`,
      [
        session,
        path,
        /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop",
        req.headers.get("referer")?.slice(0, 200) ?? null,
      ]
    );
  } catch (err) {
    console.error("[visit] insert failed", err);
  }

  const res = NextResponse.json({ ok: true, counted: true });
  // جلسة يوم كامل: زيارة واحدة للزائر الواحد في اليوم
  res.cookies.set(COOKIE, session, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
