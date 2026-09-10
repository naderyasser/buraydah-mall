-- يُشغَّل مرة واحدة قبل الإطلاق الحقيقي: يمسح كل ما هو تجريبي.
-- بعده أطفئ NEXT_PUBLIC_DEMO_BANNER في .env.local وأعد التشغيل.
BEGIN;
DELETE FROM reviews   WHERE phone = '0550000000';          -- التقييمات التجريبية
DELETE FROM questions WHERE author_name = 'زائر' AND answer LIKE 'نعم، توجد خيارات إضافية%';
DELETE FROM product_images;                                 -- معرض الصور التجريبي
UPDATE products SET views = 0;
DELETE FROM orders WHERE phone LIKE '05000%';               -- طلبات الاختبار
-- المنتجات والمحلات نفسها تُستبدل يدوياً من لوحة التحكّم، لا تُحذف هنا.
COMMIT;
