-- ٢٠٢٦-٠٩-١٢: «الطلبات» قلب المول الإعلاني — الزائر يرسل طلبه للماركة من داخل المول
-- (اسم وجوال وما يريده)، فتصل الماركة طلبات مقيسة لا نقرات فقط، ويتابعها في بوابته.
CREATE TABLE IF NOT EXISTS leads (
  id            serial PRIMARY KEY,
  token         text UNIQUE NOT NULL,                 -- رابط متابعة سرّي للزائر
  store_id      integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id    integer REFERENCES products(id) ON DELETE SET NULL,
  placement_id  integer REFERENCES ad_placements(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone         text NOT NULL,
  district      text,
  message       text,
  source        text,                                  -- الصفحة التي جاء منها الطلب
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','done','spam')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_store_idx ON leads (store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads (phone);
