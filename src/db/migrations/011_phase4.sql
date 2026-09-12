-- المرحلة الرابعة (٢٠٢٦-٠٩-١٢): ما نقص عن نون وأمازون وجرير وسلة بعد مقارنة الصفحات
-- عرض بوقت انتهاء (جرير/نون: «ينتهي العرض خلال…») — الخصم يُعرض ما دام التاريخ لم يمضِ
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;
-- إلغاء العميل لطلبه ما دام «جديداً» (نون/أمازون) — يُسجَّل من ألغى ليُقرأ في اللوحة
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by text;
-- اقتراحات البحث تبحث بالبادئة في الاسم — فهرس trigram يخدم ILIKE بأي موضع
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS products_name_trgm ON products USING gin (name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS stores_name_trgm   ON stores   USING gin (name_ar gin_trgm_ops);
