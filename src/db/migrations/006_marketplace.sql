-- المرحلة الثانية: من «صفحة منتجات» إلى متجر كامل.
-- تصنيفات فرعية، معرض صور، خيارات (مقاس/لون/عيار)، تقييمات بمراجعة،
-- كوبونات، ومشاهدات المنتج.
BEGIN;

/* ── التصنيفات الفرعية داخل القسم ── */
CREATE TABLE IF NOT EXISTS categories (
  id         serial PRIMARY KEY,
  wing_id    integer NOT NULL REFERENCES wings(id) ON DELETE CASCADE,
  slug       text UNIQUE NOT NULL,
  name_ar    text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_wing_idx ON categories(wing_id) WHERE is_active;

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id integer REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id) WHERE is_active;

/* ── معرض صور المنتج: الصورة الأولى هي image_path والباقي هنا ── */
CREATE TABLE IF NOT EXISTS product_images (
  id         serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  path       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 100
);
CREATE INDEX IF NOT EXISTS product_images_idx ON product_images(product_id, sort_order);

/* ── الخيارات: محور واحد فقط (مقاس أو لون أو عيار) — الأبسط يُستعمل ── */
CREATE TABLE IF NOT EXISTS product_variants (
  id          serial PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_ar     text NOT NULL,
  extra_price numeric(10,2) NOT NULL DEFAULT 0,
  in_stock    boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 100
);
CREATE INDEX IF NOT EXISTS product_variants_idx ON product_variants(product_id, sort_order);

ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_label text;  -- «المقاس» / «اللون» / «العيار»

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id integer REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name text;

/* ── التقييمات: لا تُنشر قبل المراجعة — السوق المحلي لا يحتمل تصفية حسابات ── */
CREATE TABLE IF NOT EXISTS reviews (
  id          serial PRIMARY KEY,
  store_id    integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id  integer REFERENCES products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  phone       text,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews(product_id) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS reviews_store_idx   ON reviews(store_id)   WHERE status = 'published';

/* ── كوبونات المول: خصم يلتزم به المحل عند الاستلام، لا بوابة دفع ── */
CREATE TABLE IF NOT EXISTS coupons (
  id           serial PRIMARY KEY,
  code         text UNIQUE NOT NULL,
  store_id     integer REFERENCES stores(id) ON DELETE CASCADE,  -- فارغ = كل المول
  kind         text NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent','amount')),
  value        numeric(10,2) NOT NULL CHECK (value > 0),
  min_total    numeric(10,2) NOT NULL DEFAULT 0,
  max_uses     integer,
  used_count   integer NOT NULL DEFAULT 0,
  expires_on   date,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric(12,2);
UPDATE orders SET subtotal = total WHERE subtotal IS NULL;

/* ── المشاهدات: أساس «الأكثر مشاهدة» و«رائج الآن» ── */
ALTER TABLE products ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

/* ── سجل البحث: يكشف ما يطلبه أهل بريدة ولا نملكه ── */
CREATE TABLE IF NOT EXISTS searches (
  id         bigserial PRIMARY KEY,
  term       text NOT NULL,
  results    integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS searches_term_idx ON searches(term);
CREATE INDEX IF NOT EXISTS searches_time_idx ON searches(created_at DESC);

COMMIT;
