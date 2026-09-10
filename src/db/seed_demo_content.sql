-- صور معرض وتقييمات تجريبية. شريط «نسخة تجريبية» يذكرها صراحة،
-- وملف demo_cleanup.sql يمسحها كلها قبل الإطلاق الحقيقي.
BEGIN;

-- معرض: صورتان إضافيتان لكل منتج من نفس عائلة صوره
INSERT INTO product_images (product_id, path, sort_order)
SELECT p.id, other.image_path, row_number() OVER (PARTITION BY p.id ORDER BY other.id)
FROM products p
JOIN LATERAL (
  SELECT p2.id, p2.image_path FROM products p2
  WHERE p2.id <> p.id AND p2.image_path IS NOT NULL
    AND split_part(replace(p2.image_path,'/demo/',''), '-', 1)
      = split_part(replace(p.image_path,'/demo/',''), '-', 1)
  ORDER BY p2.id LIMIT 2
) other ON true
WHERE p.image_path IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_images x WHERE x.product_id = p.id);

-- تقييمات تجريبية منشورة (بيانات وهمية — تُحذف قبل الإطلاق)
INSERT INTO reviews (store_id, product_id, author_name, phone, rating, body, status, created_at)
SELECT p.store_id, p.id, v.who, '0550000000', v.stars, v.txt, 'published',
       now() - (v.days || ' days')::interval
FROM products p
JOIN LATERAL (VALUES
  ('عبدالله ا.',  5, 'المنتج مطابق للصورة والتعامل ممتاز، استلمته من المحل بسرعة.', 3),
  ('محمد ع.',     4, 'جودة جيدة والسعر مناسب مقارنة بالسوق.', 9),
  ('سعد ال.',     5, 'تعامل راقٍ، وشرحوا لي الفرق بين الخيارات قبل ما أطلب.', 16)
) AS v(who, stars, txt, days) ON true
WHERE p.id % 3 = 0
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = p.id);

-- أسئلة تجريبية على المنتجات
INSERT INTO questions (product_id, store_id, author_name, body, answer, answered_at, status)
SELECT p.id, p.store_id, 'زائر',
       'هل يتوفّر خيار آخر غير المعروض؟',
       'نعم، توجد خيارات إضافية في المحل — تواصل معنا وسنجهّزها لك.',
       now(), 'published'
FROM products p WHERE p.id % 5 = 0
  AND NOT EXISTS (SELECT 1 FROM questions x WHERE x.product_id = p.id);

-- مشاهدات تجريبية حتى يعمل ترتيب «الأكثر مشاهدة»
UPDATE products SET views = (id * 7919) % 240 + 3 WHERE views = 0;

COMMIT;
