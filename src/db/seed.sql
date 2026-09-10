-- بيانات عرض توضيحية — أسماء وأرقام غير حقيقية، للمعاينة فقط
BEGIN;

CREATE OR REPLACE FUNCTION _seed_hours(a1 text, a2 text, p1 text, p2 text)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_agg(
    CASE WHEN i = 5 THEN jsonb_build_object('closed', true, 'am', null, 'pm', null)
    ELSE jsonb_build_object('closed', false,
      'am', jsonb_build_array(a1, a2), 'pm', jsonb_build_array(p1, p2)) END ORDER BY i)
  FROM generate_series(0,6) i;
$$;

INSERT INTO wings (slug, name_ar, name_en, tagline, sort_order) VALUES
 ('gold',    'الذهب والمجوهرات', 'Gold & Jewellery', 'محلات ومصانع الذهب في بريدة: أطقم الزواج، السبائك، الهدايا', 10),
 ('watches', 'الساعات والحقائب', 'Watches & Bags',   'ساعات وحقائب ووكلاء العلامات العالمية داخل المدينة', 20),
 ('fabrics', 'الأقمشة والملابس', 'Fabrics & Clothing','أقمشة، فساتين سهرة، عبايات، وملابس جاهزة', 30)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO stores
 (slug, wing_id, name_ar, name_en, summary_ar, dest_type, dest_value, district, address_line, phone, hours, tags, tier, sort_order)
VALUES
 ('safra-jewellery', (SELECT id FROM wings WHERE slug='gold'), 'مجوهرات الصفراء', 'Al-Safra Jewellery',
  'أطقم زواج وذهب عيار 21 و18، وخدمة تفصيل حسب الطلب.', 'whatsapp', '0555000101', 'الصفراء',
  'طريق الملك عبدالعزيز', '0555000101', _seed_hours('09:00','12:30','16:30','23:00'),
  ARRAY['ذهب عيار 21','أطقم زواج','تفصيل حسب الطلب'], 'featured', 10),

 ('qassim-gold', (SELECT id FROM wings WHERE slug='gold'), 'ذهب القصيم', 'Qassim Gold',
  'سبائك وجنيهات ذهب بأسعار السوق اليومية.', 'whatsapp', '0555000102', 'الخبيب',
  'شارع الخبيب العام', '0555000102', _seed_hours('09:30','12:30','16:30','22:30'),
  ARRAY['سبائك','جنيهات','عيار 24'], 'paid', 20),

 ('durrat-albahr', (SELECT id FROM wings WHERE slug='gold'), 'درة البحر للمجوهرات', 'Durrat Al-Bahr',
  'لؤلؤ وألماس وأطقم مناسبات.', 'instagram', 'durrat.albahr', 'الروضة',
  'مجمع الروضة التجاري', '0555000103', _seed_hours('10:00','12:30','16:00','22:00'),
  ARRAY['ألماس','لؤلؤ','خواتم خطوبة'], 'free', 30),

 ('bin-saleh-gold', (SELECT id FROM wings WHERE slug='gold'), 'مجوهرات ابن صالح', NULL,
  'محل عائلي منذ أكثر من ثلاثين سنة في سوق الذهب.', 'map', 'سوق الذهب بريدة', 'الموطأ',
  'سوق الذهب القديم', '0555000104', _seed_hours('09:00','12:00','16:00','21:30'),
  ARRAY['ذهب مستعمل','تبديل','عيار 21'], 'free', 40),

 ('waqt-watches', (SELECT id FROM wings WHERE slug='watches'), 'معرض الوقت للساعات', 'Al-Waqt Watches',
  'ساعات سويسرية أصلية مع ضمان الوكيل وصيانة داخلية.', 'store', 'https://example.com/alwaqt', 'النخيل',
  'طريق عمر بن الخطاب', '0555000201', _seed_hours('09:30','12:30','16:30','22:30'),
  ARRAY['ساعات سويسرية','صيانة ساعات','ضمان وكيل'], 'featured', 10),

 ('elegance-bags', (SELECT id FROM wings WHERE slug='watches'), 'إليجانس للحقائب', 'Elegance Bags',
  'حقائب نسائية ورجالية وماركات عالمية.', 'instagram', 'elegance.bags.qsm', 'الفايزية',
  'مجمع الفايزية', '0555000202', _seed_hours('10:00','12:30','17:00','23:00'),
  ARRAY['حقائب نسائية','حقائب سفر','محافظ'], 'free', 20),

 ('time-house', (SELECT id FROM wings WHERE slug='watches'), 'بيت الساعة', 'Time House',
  'ساعات كلاسيكية وخدمة تغيير بطاريات وأحزمة.', 'whatsapp', '0555000203', 'الإسكان',
  'شارع الملك فهد', '0555000203', _seed_hours('09:00','12:00','16:00','22:00'),
  ARRAY['بطاريات ساعات','أحزمة جلد','ساعات كلاسيكية'], 'free', 30),

 ('leather-corner', (SELECT id FROM wings WHERE slug='watches'), 'ركن الجلود', 'Leather Corner',
  'جلود طبيعية وحقائب مكتب ومحافظ بأسماء محفورة.', 'snapchat', 'leather.corner', 'السلام',
  'طريق الملك عبدالله', '0555000204', _seed_hours('09:30','12:30','16:30','22:30'),
  ARRAY['جلد طبيعي','حفر أسماء','حقائب مكتب'], 'free', 40),

 ('qasr-alaqmisha', (SELECT id FROM wings WHERE slug='fabrics'), 'قصر الأقمشة', 'Fabric Palace',
  'أقمشة عبايات وثياب رجالية وتفصيل داخلي.', 'whatsapp', '0555000301', 'الرحاب',
  'شارع الأقمشة', '0555000301', _seed_hours('09:00','12:30','16:00','23:00'),
  ARRAY['أقمشة عبايات','قماش ثياب','تفصيل'], 'featured', 10),

 ('sahar-dresses', (SELECT id FROM wings WHERE slug='fabrics'), 'دار سحر للفساتين', 'Dar Sahar',
  'فساتين سهرة وخطوبة جاهزة وتفصيل بمقاسات خاصة.', 'instagram', 'dar.sahar.dresses', 'النخيل',
  'مجمع النخيل النسائي', '0555000302', _seed_hours('10:00','13:00','17:00','23:00'),
  ARRAY['فساتين سهرة','فساتين خطوبة','تفصيل نسائي'], 'paid', 20),

 ('abaya-almisk', (SELECT id FROM wings WHERE slug='fabrics'), 'عبايات المسك', NULL,
  'عبايات يومية ومناسبات بتصاميم محلية.', 'snapchat', 'abaya.almisk', 'الشماس',
  'شارع الشماس', '0555000303', _seed_hours('10:00','12:30','16:30','22:30'),
  ARRAY['عبايات مناسبات','عباية يومية','تطريز'], 'free', 30),

 ('kids-world-qsm', (SELECT id FROM wings WHERE slug='fabrics'), 'عالم الأطفال', 'Kids World',
  'ملابس أطفال جاهزة من عمر سنة إلى اثنتي عشرة سنة.', 'store', 'https://example.com/kidsworld', 'الروضة',
  'مجمع الروضة', '0555000304', _seed_hours('09:30','12:30','16:00','22:00'),
  ARRAY['ملابس أطفال','ملابس مدارس','أطقم عيد'], 'free', 40),

 ('rijal-thobes', (SELECT id FROM wings WHERE slug='fabrics'), 'مشاغل الرجال للتفصيل', NULL,
  'تفصيل ثياب رجالية بخياطين متخصصين وتسليم خلال ثلاثة أيام.', 'whatsapp', '0555000305', 'الخبيب',
  'سوق الخبيب', '0555000305', _seed_hours('08:30','12:00','16:00','22:00'),
  ARRAY['تفصيل ثياب','خياطة رجالية','تسليم سريع'], 'free', 50)
ON CONFLICT (slug) DO NOTHING;

DROP FUNCTION _seed_hours(text, text, text, text);
COMMIT;
