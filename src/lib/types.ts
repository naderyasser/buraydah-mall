export type DestType =
  | "whatsapp" | "store" | "website" | "instagram" | "snapchat" | "map";

export type DayHours = {
  closed: boolean;
  /** فترتان: صباحية ومسائية — عرف سوق بريدة */
  am?: [string, string] | null;
  pm?: [string, string] | null;
};

export type Wing = {
  id: number; slug: string; name_ar: string; name_en: string | null;
  tagline: string | null; sort_order: number; is_active: boolean;
};

export type Store = {
  id: number; slug: string; wing_id: number;
  name_ar: string; name_en: string | null;
  logo_path: string | null; summary_ar: string | null;
  dest_type: DestType; dest_value: string; whatsapp_text: string | null;
  address_line: string | null; district: string | null; city: string;
  map_url: string | null; phone: string | null;
  hours: DayHours[]; tags: string[];
  tier: "free" | "paid" | "featured";
  sort_order: number; is_active: boolean;
  data_updated_at: string;
};

export type Product = {
  id: number; slug: string; store_id: number; name_ar: string;
  description_ar: string | null; price: string | number;
  compare_price: string | number | null; image_path: string | null;
  unit: string | null; tags: string[]; in_stock: boolean;
  sort_order: number; is_active: boolean;
};

export type ProductWithStore = Product & {
  store_name: string; store_slug: string; wing_slug?: string; wing_name?: string;
};

export type OrderRow = {
  id: number; code: string; token: string; customer_name: string; phone: string;
  district: string | null; fulfilment: "pickup" | "delivery"; note: string | null;
  total: string; items_count: number; stores_count: number;
  status: "new" | "confirmed" | "done" | "cancelled"; created_at: string;
};
