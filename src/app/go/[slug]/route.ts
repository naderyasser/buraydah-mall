import { NextRequest, NextResponse } from "next/server";
import { q1, q } from "@/db";
import { buildDestUrl, withSource } from "@/lib/destinations";
import type { Store } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * العمود الفقري التجاري: تُسجَّل النقرة أولاً ثم يُحوَّل الزائر.
 * تغيير رقم أو رابط المحل لاحقاً لا يكسر أي رابط منشور.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const store = await q1<Store>(
    `SELECT id, wing_id, slug, name_ar, dest_type, dest_value, whatsapp_text
     FROM stores WHERE slug = $1 AND is_active`,
    [slug]
  );
  if (!store) return NextResponse.redirect(new URL("/", req.url), 302);

  const ua = req.headers.get("user-agent") ?? "";
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
  const referrer = req.headers.get("referer")?.slice(0, 300) ?? null;
  const ad = Number(req.nextUrl.searchParams.get("ad")) || null; // النقرة من مساحة إعلانية تُنسب لحجزها

  // لا نُسقط التحويل لو فشل التسجيل — الزائر أهم من الإحصائية
  try {
    await q(
      `INSERT INTO clicks (store_id, wing_id, dest_type, device, referrer, placement_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [store.id, store.wing_id, store.dest_type, device, referrer, ad]
    );
  } catch (err) {
    console.error("[go] click log failed", err);
  }

  const target = withSource(buildDestUrl(store), store.dest_type);
  return NextResponse.redirect(target, 302);
}
