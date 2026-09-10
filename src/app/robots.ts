import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** الدليل المحلي يعيش على البحث — لكن صفحات التحويل والطلبات لا تُفهرَس */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/go/", "/order/", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
