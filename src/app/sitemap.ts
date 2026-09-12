import type { MetadataRoute } from "next";
import { q } from "@/db";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/** كل ما يستحق الفهرسة: الأقسام والمحلات والمنتجات — لا صفحات الطلب ولا التحويل */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [wings, stores, products] = await Promise.all([
    q<{ slug: string }>(`SELECT slug FROM wings WHERE is_active ORDER BY sort_order`),
    q<{ slug: string; data_updated_at: Date }>(
      `SELECT slug, data_updated_at FROM stores WHERE is_active`
    ),
    q<{ slug: string; created_at: Date }>(
      `SELECT slug, created_at FROM products WHERE is_active`
    ),
  ]);

  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/stores`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/advertise`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/requests`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/track`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...wings.map((w) => ({
      url: `${SITE_URL}/wing/${w.slug}`,
      lastModified: now, changeFrequency: "daily" as const, priority: 0.9,
    })),
    ...stores.map((s) => ({
      url: `${SITE_URL}/store/${s.slug}`,
      lastModified: s.data_updated_at, changeFrequency: "weekly" as const, priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.created_at, changeFrequency: "weekly" as const, priority: 0.7,
    })),
  ];
}
