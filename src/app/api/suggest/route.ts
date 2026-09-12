import { NextResponse } from "next/server";
import { suggest } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** اقتراحات البحث الفورية — GET فقط، وحدّ nginx يكفيها لأنها استعلام رخيص مفهرس */
export async function GET(req: Request) {
  const term = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (term.length < 2) return NextResponse.json({ products: [], stores: [], categories: [] });
  const data = await suggest(term);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
}
