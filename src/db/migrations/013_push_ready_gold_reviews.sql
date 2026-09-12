-- ٢٠٢٦-٠٩-١٢: ما عند متاجر المملكة وينفع بلا بوابة دفع
-- ١) إعدادات المول (واتساب المول، سعر جرام الذهب) تُدار من اللوحة لا من ملف env
CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO site_settings (key, value) VALUES ('mall_whatsapp',''), ('gold_gram_21',''), ('gold_gram_18',''), ('gold_gram_24','')
ON CONFLICT (key) DO NOTHING;
-- ٢) إشعارات الدفع للتاجر (Web Push): اشتراك المتصفّح لكل محل
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         serial PRIMARY KEY,
  store_id   integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  endpoint   text UNIQUE NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ٣) حالة «جاهز للاستلام / في الطريق» بين التأكيد والتسليم (كتتبّع نون بلا بوليصة)
-- قيد الحالة القديم يُستبدل بواحد يعرف 'ready'
ALTER TABLE orders      DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
ALTER TABLE orders      ADD CONSTRAINT orders_status_check      CHECK (status IN ('new','confirmed','ready','done','cancelled'));
ALTER TABLE order_items ADD CONSTRAINT order_items_status_check CHECK (status IN ('new','confirmed','ready','done','cancelled'));
-- ٤) وزن الذهب بالجرام، وصورة مع التقييم
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_g numeric(8,2);
ALTER TABLE reviews  ADD COLUMN IF NOT EXISTS image_path text;
