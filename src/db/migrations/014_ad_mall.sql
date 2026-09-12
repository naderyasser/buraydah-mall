-- ٢٠٢٦-٠٩-١٢: التحوّل إلى «مول إلكتروني إعلاني / دليل ماركات» بطلب العميل
-- الماركة تستأجر مساحة (صفحة كاملة / نصف / ربع / خانة صغيرة) بالشهر، والزائر يُحوَّل لموقعها.
-- البيع داخل المول يبقى في الكود مطفأً بمفتاح mall_mode — لو عاد العميل عنه لا يُعاد البناء.

-- ١) نمط المول وأسعار المساحات (تُدار من /admin/settings)
INSERT INTO site_settings (key, value) VALUES
  ('mall_mode', 'directory'),
  ('ad_price_full', '3000'), ('ad_price_half', '1800'), ('ad_price_quarter', '1000'), ('ad_price_small', '400'),
  ('ad_bank_note', 'التحويل البنكي — يُفعَّل الاشتراك خلال يوم عمل من وصول الحوالة')
ON CONFLICT (key) DO NOTHING;

-- ٢) المساحات: لكل منطقة (الرئيسية أو قطاع) خانات بحجم وترتيب
CREATE TABLE IF NOT EXISTS ad_spaces (
  id         serial PRIMARY KEY,
  zone       text NOT NULL,                     -- 'home' أو 'wing:<slug>'
  size       text NOT NULL CHECK (size IN ('full','half','quarter','small')),
  position   integer NOT NULL DEFAULT 1,
  is_active  boolean NOT NULL DEFAULT true,
  UNIQUE (zone, size, position)
);

-- ٣) الحجوزات: ماركة في مساحة من تاريخ إلى تاريخ بسعر
CREATE TABLE IF NOT EXISTS ad_placements (
  id          serial PRIMARY KEY,
  space_id    integer NOT NULL REFERENCES ad_spaces(id) ON DELETE CASCADE,
  store_id    integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  starts_on   date NOT NULL DEFAULT current_date,
  ends_on     date NOT NULL,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','expired','cancelled')),
  headline    text,                              -- سطر إعلاني اختياري للمساحات الكبيرة
  image_path  text,                              -- صورة إعلانية اختيارية (بدل الشعار) للكاملة والنصف
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ad_placements_live ON ad_placements (space_id, starts_on, ends_on) WHERE status = 'active';

-- ٤) الظهور اليومي لكل حجز (يُحدَّث من المتصفّح كي لا تُحسب الزواحف)
CREATE TABLE IF NOT EXISTS ad_impressions (
  placement_id integer NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  day          date NOT NULL DEFAULT current_date,
  n            integer NOT NULL DEFAULT 0,
  PRIMARY KEY (placement_id, day)
);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS placement_id integer REFERENCES ad_placements(id) ON DELETE SET NULL;

-- ٥) طلبات حجز المساحات من المعلنين (قبل التفعيل اليدوي)
CREATE TABLE IF NOT EXISTS ad_requests (
  id           serial PRIMARY KEY,
  brand_name   text NOT NULL,
  contact_name text,
  phone        text NOT NULL,
  website      text,
  size         text NOT NULL,
  months       integer NOT NULL DEFAULT 1,
  wing_slug    text,
  note         text,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','booked','rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ٦) القطاعات الجديدة إلى جانب الأجنحة الستة
INSERT INTO wings (slug, name_ar, name_en, tagline, sort_order) VALUES
  ('restaurants', 'المطاعم والكافيهات', 'Restaurants', 'مطاعم وكافيهات بريدة — القائمة والطلب من موقع كل مطعم', 70),
  ('pharmacies',  'الصيدليات',          'Pharmacies',  'صيدليات ومستلزمات طبية',                                  80),
  ('beauty',      'مراكز التجميل',       'Beauty',      'صالونات وعيادات تجميل ومنتجات عناية',                     90),
  ('clinics',     'المستوصفات والعيادات','Clinics',     'مستوصفات وعيادات ومختبرات',                               100),
  ('electronics', 'الإلكترونيات',        'Electronics', 'جوالات وأجهزة ومتاجر تقنية',                              110),
  ('home',        'الأثاث والمنزل',      'Home',        'أثاث وديكور وأدوات منزلية',                                120)
ON CONFLICT (slug) DO NOTHING;

-- ٧) مساحات الرئيسية الافتراضية: كاملة ١، نصف ٢، ربع ٤، صغيرة ٢٤ — ومثلها أصغر لكل قطاع
INSERT INTO ad_spaces (zone, size, position)
SELECT 'home', 'full', 1 UNION ALL
SELECT 'home', 'half', g FROM generate_series(1,2) g UNION ALL
SELECT 'home', 'quarter', g FROM generate_series(1,4) g UNION ALL
SELECT 'home', 'small', g FROM generate_series(1,24) g
ON CONFLICT DO NOTHING;
INSERT INTO ad_spaces (zone, size, position)
SELECT 'wing:' || w.slug, s.size, s.pos
FROM wings w CROSS JOIN (
  SELECT 'full' AS size, 1 AS pos UNION ALL
  SELECT 'half', 1 UNION ALL SELECT 'half', 2 UNION ALL
  SELECT 'quarter', g FROM generate_series(1,4) g UNION ALL
  SELECT 'small', g FROM generate_series(1,12) g
) s
ON CONFLICT DO NOTHING;
