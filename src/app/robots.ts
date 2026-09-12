import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { mallMode } from "@/lib/ads";

/** الدليل المحلي يعيش على البحث — لكن صفحات التحويل والطلبات لا تُفهرَس */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const directory = (await mallMode().catch(() => "directory")) === "directory";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/merchant", "/go/", "/order/", "/orders", "/api/",
      ...(directory ? ["/product/", "/cart", "/checkout", "/requests", "/track", "/favorites", "/national-day"] : [])] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
