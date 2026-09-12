import { q, q1 } from "@/db";

/** إعدادات المول من القاعدة — تُدار من /admin/settings بلا إعادة تشغيل */
export async function getSetting(key: string): Promise<string> {
  const r = await q1<{ value: string }>(`SELECT value FROM site_settings WHERE key = $1`, [key]);
  return r?.value ?? "";
}
export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await q<{ key: string; value: string }>(`SELECT key, value FROM site_settings WHERE key = ANY($1)`, [keys]);
  const out: Record<string, string> = {}; for (const k of keys) out[k] = "";
  for (const r of rows) out[r.key] = r.value;
  return out;
}
export async function setSetting(key: string, value: string) {
  await q(`INSERT INTO site_settings (key, value, updated_at) VALUES ($1,$2,now())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`, [key, value]);
}
/** جوال سعودي → صيغة wa.me */
export const waNumber = (v: string) => v.replace(/[^0-9]/g, "").replace(/^0/, "966").replace(/^5/, "9665");
