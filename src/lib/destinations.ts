import type { DestType, Store } from "./types";

/**
 * قرار «محلي» جعل الوجهة متعدّدة الأنواع: أغلب محلات بريدة بلا موقع
 * إلكتروني، فوجهتها واتساب أو حساب تواصل أو موقع على الخريطة.
 */
export const DEST_META: Record<
  DestType,
  { label: string; button: string; tone: "wa" | "brand" | "map" }
> = {
  whatsapp:  { label: "واتساب",       button: "تواصل واتساب",     tone: "wa" },
  store:     { label: "متجر إلكتروني", button: "زيارة المتجر",      tone: "brand" },
  website:   { label: "موقع إلكتروني", button: "زيارة الموقع",      tone: "brand" },
  instagram: { label: "إنستقرام",     button: "حساب إنستقرام",    tone: "brand" },
  snapchat:  { label: "سناب شات",     button: "حساب سناب شات",    tone: "brand" },
  map:       { label: "الخريطة",       button: "الموقع على الخريطة", tone: "map" },
};

const digits = (v: string) => v.replace(/[^\d]/g, "");

/** يحوّل قيمة الوجهة المخزّنة إلى رابط كامل صالح للتحويل */
export function buildDestUrl(store: Pick<Store, "dest_type" | "dest_value" | "whatsapp_text" | "name_ar">): string {
  const v = store.dest_value.trim();
  switch (store.dest_type) {
    case "whatsapp": {
      let n = digits(v);
      if (n.startsWith("00")) n = n.slice(2);
      if (n.startsWith("05")) n = "966" + n.slice(1);
      else if (n.startsWith("5") && n.length === 9) n = "966" + n;
      const text = store.whatsapp_text?.trim() || `السلام عليكم، وصلت لكم من مول بريدة — ${store.name_ar}`;
      return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
    }
    case "instagram":
      return v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`;
    case "snapchat":
      return v.startsWith("http") ? v : `https://snapchat.com/add/${v.replace(/^@/, "")}`;
    case "map":
      return v.startsWith("http") ? v : `https://maps.google.com/?q=${encodeURIComponent(v)}`;
    default:
      return v.startsWith("http") ? v : `https://${v}`;
  }
}

/** وسم المصدر — يُضاف للوجهات الخارجية فقط، لا للواتساب */
export function withSource(url: string, dest: DestType): string {
  if (dest === "whatsapp") return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "buraydah-mall");
    return u.toString();
  } catch {
    return url;
  }
}
