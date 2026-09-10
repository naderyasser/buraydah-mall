-- فهارس الإنتاج: كل واحد منها يخدم استعلاماً موجوداً فعلاً في الكود،
-- لا فهرسة احتياطية «لعلّها تنفع».
BEGIN;

-- التتبّع والتقييم يبحثان بالجوال
CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (regexp_replace(phone, '[^0-9]', '', 'g'));
CREATE INDEX IF NOT EXISTS orders_code_upper_idx ON orders (upper(code));

-- «الأكثر مشاهدة» و«وصل حديثاً» على الرئيسية
CREATE INDEX IF NOT EXISTS products_views_idx   ON products (views DESC)      WHERE is_active;
CREATE INDEX IF NOT EXISTS products_created_idx ON products (created_at DESC) WHERE is_active;
CREATE INDEX IF NOT EXISTS products_sale_idx    ON products (store_id)
  WHERE is_active AND compare_price IS NOT NULL;

-- الفرز بالسعر داخل القسم
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price) WHERE is_active;

-- الكوبون يُقرأ بالرمز بحروف كبيرة
CREATE INDEX IF NOT EXISTS coupons_code_upper_idx ON coupons (upper(code));

-- سطور الطلب: لوحة التاجر تقرأها بالمحل والحالة
CREATE INDEX IF NOT EXISTS order_items_store_status_idx ON order_items (store_id, status);

-- المتابعة والتنبيهات
CREATE INDEX IF NOT EXISTS follows_phone_idx ON follows (phone);
CREATE INDEX IF NOT EXISTS stock_alerts_pending_idx ON stock_alerts (product_id) WHERE NOT notified;

-- التقييمات المنشورة تُجمَّع بالمحل
CREATE INDEX IF NOT EXISTS reviews_store_pub_idx ON reviews (store_id, rating) WHERE status = 'published';

COMMIT;
