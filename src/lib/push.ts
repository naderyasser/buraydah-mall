import webpush from "web-push";
import { q } from "@/db";
import { getSettings } from "@/lib/settings";

/**
 * إشعار دفع لمتصفّحات التاجر المسجّلة (Web Push بلا مزوّد): مفاتيح VAPID في
 * site_settings. الاشتراك المنتهي (410/404) يُحذف كي لا يتراكم.
 */
export async function pushToStore(storeId: number, payload: { title: string; body: string; url?: string; tag?: string }) {
  const s = await getSettings(["vapid_public", "vapid_private"]);
  if (!s.vapid_public || !s.vapid_private) return;
  webpush.setVapidDetails("mailto:quantaacademy12@gmail.com", s.vapid_public, s.vapid_private);
  const subs = await q<{ id: number; endpoint: string; p256dh: string; auth: string }>(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE store_id = $1`, [storeId]);
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 3600 });
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await q(`DELETE FROM push_subscriptions WHERE id = $1`, [sub.id]);
      else console.error("[push] failed", e?.statusCode ?? e);
    }
  }));
}
