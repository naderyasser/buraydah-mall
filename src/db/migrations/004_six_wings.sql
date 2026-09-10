-- مطابقة المواصفات: ستة أقسام كما نصّ العميل، وشعار لكل ماركة،
-- وماركات «دليل فقط» بلا منتجات تُظهر التحويل المباشر كما في التسجيلات.
BEGIN;

UPDATE wings SET name_ar = 'الذهب والمجوهرات', tagline = 'محلات ومصانع ذهب في بريدة: أطقم الزواج، السبائك، الهدايا', sort_order = 10 WHERE slug = 'gold';
UPDATE wings SET name_ar = 'الساعات',          tagline = 'ساعات سويسرية وكلاسيكية وخدمات صيانة داخل المدينة',      sort_order = 20 WHERE slug = 'watches';
UPDATE wings SET name_ar = 'الأقمشة',          tagline = 'أقمشة عبايات وثياب، بالمتر ومع خدمة التفصيل',            sort_order = 40 WHERE slug = 'fabrics';

INSERT INTO wings (slug, name_ar, name_en, tagline, sort_order) VALUES
 ('bags',     'الشنط والحقائب', 'Bags',     'حقائب نسائية ورجالية وجلود طبيعية',        30),
 ('clothing', 'الملابس',        'Clothing', 'ملابس رجالية وأطفال، جاهزة وتفصيل',        50),
 ('dresses',  'الفساتين',       'Dresses',  'فساتين سهرة وخطوبة وعبايات مناسبات',       60)
ON CONFLICT (slug) DO NOTHING;

UPDATE stores SET wing_id = (SELECT id FROM wings WHERE slug='bags')     WHERE slug IN ('elegance-bags','leather-corner');
UPDATE stores SET wing_id = (SELECT id FROM wings WHERE slug='clothing') WHERE slug IN ('kids-world-qsm','rijal-thobes');
UPDATE stores SET wing_id = (SELECT id FROM wings WHERE slug='dresses')  WHERE slug IN ('sahar-dresses','abaya-almisk');

-- شعار لكل ماركة (مؤقت حتى يصل الشعار الأصلي من التاجر)
UPDATE stores SET logo_path = '/logos/' || slug || '.svg' WHERE logo_path IS NULL;

-- ماركات «دليل فقط»: بلا منتجات، الضغط عليها يحوّل لموقعها مباشرة
INSERT INTO stores (slug, wing_id, name_ar, name_en, summary_ar, logo_path, dest_type, dest_value,
                    district, address_line, phone, hours, tags, tier, sort_order)
VALUES
 ('wisam-gold-factory', (SELECT id FROM wings WHERE slug='gold'), 'مصنع الوسام للذهب', 'Al-Wisam Gold',
  'مصنع ذهب بمعرض خاص — الطلب والأسعار عبر موقعهم.', '/logos/wisam-gold-factory.svg',
  'website', 'https://example.com/alwisam', 'الصناعية', 'المنطقة الصناعية الأولى', '0555000401',
  '[]'::jsonb, ARRAY['مصنع ذهب','بالجملة'], 'free', 90),
 ('zaman-watches', (SELECT id FROM wings WHERE slug='watches'), 'وكالة الزمن للساعات', 'Zaman Watches',
  'وكيل معتمد لعلامات عالمية — المتجر الرسمي أونلاين.', '/logos/zaman-watches.svg',
  'store', 'https://example.com/zaman', 'الروضة', 'طريق الملك عبدالعزيز', '0555000402',
  '[]'::jsonb, ARRAY['وكيل معتمد','ساعات عالمية'], 'free', 90),
 ('anaqa-boutique', (SELECT id FROM wings WHERE slug='bags'), 'بوتيك الأناقة', 'Anaqa Boutique',
  'حقائب وإكسسوارات — المعروض والأسعار على حسابهم.', '/logos/anaqa-boutique.svg',
  'instagram', 'anaqa.boutique.qsm', 'النخيل', 'مجمع النخيل', '0555000403',
  '[]'::jsonb, ARRAY['حقائب','إكسسوارات'], 'free', 90),
 ('azyaa-aldirah', (SELECT id FROM wings WHERE slug='clothing'), 'أزياء الديرة', 'Azyaa Al-Dirah',
  'ملابس رجالية جاهزة — الجديد ينزل على السناب أولاً.', '/logos/azyaa-aldirah.svg',
  'snapchat', 'azyaa.aldirah', 'الخبيب', 'شارع الخبيب', '0555000404',
  '[]'::jsonb, ARRAY['ملابس رجالية','جاهز'], 'free', 90)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
