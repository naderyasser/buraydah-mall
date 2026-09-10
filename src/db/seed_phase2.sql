-- بيانات تجريبية للمرحلة الثانية: تصنيفات فرعية، خيارات، مواصفات،
-- إفصاح نظامي، رسوم توصيل، كوبونات، وأسئلة — كلها أمثلة تُستبدل بالحقيقي.
BEGIN;

/* ── التصنيفات الفرعية داخل كل قسم ── */
INSERT INTO categories (wing_id, slug, name_ar, sort_order) VALUES
 ((SELECT id FROM wings WHERE slug='gold'),     'rings',      'خواتم',            10),
 ((SELECT id FROM wings WHERE slug='gold'),     'necklaces',  'عقود وقلائد',      20),
 ((SELECT id FROM wings WHERE slug='gold'),     'bracelets',  'أساور',            30),
 ((SELECT id FROM wings WHERE slug='gold'),     'wedding-sets','أطقم زواج',       40),
 ((SELECT id FROM wings WHERE slug='watches'),  'mens-watches','ساعات رجالية',    10),
 ((SELECT id FROM wings WHERE slug='watches'),  'classic-watches','ساعات كلاسيكية',20),
 ((SELECT id FROM wings WHERE slug='watches'),  'smart-watches','ساعات ذكية',     30),
 ((SELECT id FROM wings WHERE slug='bags'),     'leather-bags','حقائب جلد',       10),
 ((SELECT id FROM wings WHERE slug='bags'),     'travel-bags','حقائب سفر',        20),
 ((SELECT id FROM wings WHERE slug='bags'),     'wallets',    'محافظ',            30),
 ((SELECT id FROM wings WHERE slug='fabrics'),  'abaya-fabric','أقمشة عبايات',    10),
 ((SELECT id FROM wings WHERE slug='fabrics'),  'thobe-fabric','أقمشة ثياب',      20),
 ((SELECT id FROM wings WHERE slug='fabrics'),  'winter-fabric','أقمشة شتوية',    30),
 ((SELECT id FROM wings WHERE slug='clothing'), 'thobes',     'ثياب رجالية',      10),
 ((SELECT id FROM wings WHERE slug='clothing'), 'kids',       'ملابس أطفال',      20),
 ((SELECT id FROM wings WHERE slug='clothing'), 'tailoring',  'تفصيل',            30),
 ((SELECT id FROM wings WHERE slug='dresses'),  'evening',    'فساتين سهرة',      10),
 ((SELECT id FROM wings WHERE slug='dresses'),  'engagement', 'فساتين خطوبة',     20),
 ((SELECT id FROM wings WHERE slug='dresses'),  'abayas',     'عبايات مناسبات',   30)
ON CONFLICT (slug) DO NOTHING;

/* ربط المنتجات القائمة بتصنيفاتها بحسب اسمها */
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='rings')       WHERE name_ar ILIKE '%خاتم%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='necklaces')   WHERE name_ar ILIKE '%عقد%' OR name_ar ILIKE '%قلادة%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='bracelets')   WHERE name_ar ILIKE '%أسورة%' OR name_ar ILIKE '%اسورة%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='wedding-sets')WHERE name_ar ILIKE '%طقم%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='mens-watches')WHERE name_ar ILIKE '%ساعة%' AND category_id IS NULL;
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='leather-bags')WHERE (name_ar ILIKE '%حقيبة%' OR name_ar ILIKE '%شنطة%') AND category_id IS NULL;
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='abaya-fabric')WHERE name_ar ILIKE '%قماش%عباي%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='thobe-fabric')WHERE name_ar ILIKE '%قماش%' AND category_id IS NULL;
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='evening')     WHERE name_ar ILIKE '%فستان%';
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='abayas')      WHERE name_ar ILIKE '%عباية%' AND category_id IS NULL;
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='thobes')      WHERE name_ar ILIKE '%ثوب%' AND category_id IS NULL;
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug='kids')        WHERE name_ar ILIKE '%أطفال%' AND category_id IS NULL;

/* ── الإفصاح النظامي وبيانات التوصيل (أمثلة) ── */
UPDATE stores SET
  cr_number      = '11' || lpad((1000000 + id * 7919)::text, 8, '0'),
  vat_number     = '3' || lpad((100000000 + id * 104729)::text, 14, '0'),
  maroof_number  = (200000 + id * 137)::text,
  is_verified    = (tier <> 'free'),
  delivery_fee   = CASE WHEN id % 3 = 0 THEN 0 ELSE 15 END,
  free_delivery_over = CASE WHEN id % 2 = 0 THEN 300 ELSE NULL END,
  returns_policy = 'استبدال أو استرجاع خلال ٧ أيام بالفاتورة وبحالة المنتج الأصلية.'
WHERE cr_number IS NULL;

/* ── محاور الخيارات لكل صنف ── */
UPDATE products SET variant_label = 'المقاس' WHERE name_ar ILIKE '%فستان%' OR name_ar ILIKE '%عباية%' OR name_ar ILIKE '%ثوب%';
UPDATE products SET variant_label = 'الطول'  WHERE name_ar ILIKE '%قماش%';
UPDATE products SET variant_label = 'العيار' WHERE name_ar ILIKE '%خاتم%' OR name_ar ILIKE '%أسورة%';

/* خيارات الفساتين والعبايات والثياب: مقاسات */
INSERT INTO product_variants (product_id, name_ar, extra_price, sort_order)
SELECT p.id, v.name, v.extra, v.ord
FROM products p
CROSS JOIN (VALUES ('مقاس 38', 0, 10), ('مقاس 40', 0, 20), ('مقاس 42', 50, 30), ('مقاس 44', 80, 40)) AS v(name, extra, ord)
WHERE p.variant_label = 'المقاس'
  AND NOT EXISTS (SELECT 1 FROM product_variants x WHERE x.product_id = p.id);

/* الأقمشة تُباع بالمتر: أطوال جاهزة */
INSERT INTO product_variants (product_id, name_ar, extra_price, sort_order)
SELECT p.id, v.name, round(p.price * v.mult, 2), v.ord
FROM products p
CROSS JOIN (VALUES ('٢ متر', 1, 10), ('٤ أمتار', 3, 20), ('٦ أمتار', 5, 30)) AS v(name, mult, ord)
WHERE p.variant_label = 'الطول'
  AND NOT EXISTS (SELECT 1 FROM product_variants x WHERE x.product_id = p.id);

/* الذهب بالعيار */
INSERT INTO product_variants (product_id, name_ar, extra_price, sort_order)
SELECT p.id, v.name, round(p.price * v.mult, 2), v.ord
FROM products p
CROSS JOIN (VALUES ('عيار 18', -0.12, 10), ('عيار 21', 0, 20), ('عيار 24', 0.15, 30)) AS v(name, mult, ord)
WHERE p.variant_label = 'العيار'
  AND NOT EXISTS (SELECT 1 FROM product_variants x WHERE x.product_id = p.id);

/* ── المواصفات ── */
UPDATE products SET specs = '[{"k":"العيار","v":"21 قيراط"},{"k":"البلد","v":"صناعة سعودية"},{"k":"الضمان","v":"ضمان الوزن والعيار من المحل"}]'::jsonb
 WHERE variant_label = 'العيار' AND specs = '[]'::jsonb;
UPDATE products SET specs = '[{"k":"العرض","v":"150 سم"},{"k":"البيع","v":"بالمتر"},{"k":"العناية","v":"غسيل جاف"}]'::jsonb
 WHERE variant_label = 'الطول' AND specs = '[]'::jsonb;
UPDATE products SET specs = '[{"k":"الخامة","v":"قماش مبطّن"},{"k":"التفصيل","v":"يُعدَّل على المقاس داخل المحل"}]'::jsonb
 WHERE variant_label = 'المقاس' AND specs = '[]'::jsonb;
UPDATE products SET specs = '[{"k":"الحركة","v":"أوتوماتيك"},{"k":"مقاومة الماء","v":"100 متر"},{"k":"الضمان","v":"12 شهراً من الوكيل"}]'::jsonb
 WHERE name_ar ILIKE '%ساعة%' AND specs = '[]'::jsonb;

/* ── تخفيضات على ربع المنتجات: عرض حقيقي لا زينة ── */
UPDATE products SET compare_price = round(price * 1.25, 2)
 WHERE compare_price IS NULL AND id % 4 = 0;

/* ── كوبونات ── */
INSERT INTO coupons (code, kind, value, min_total, expires_on) VALUES
 ('BURAYDAH10', 'percent', 10, 200, current_date + 60),
 ('AHLAN25',    'amount',  25, 150, current_date + 30)
ON CONFLICT (code) DO NOTHING;

/* ── منتج نافد واحد ليظهر «أعلمني عند التوفّر» ── */
UPDATE products SET in_stock = false WHERE id = (SELECT max(id) FROM products);

COMMIT;
