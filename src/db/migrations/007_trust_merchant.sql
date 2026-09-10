-- الثقة والامتثال وبوابة التاجر.
-- نظام التجارة الإلكترونية السعودي يوجب إفصاح كل محل عن سجله التجاري
-- ورقمه الضريبي ووسيلة تواصله، وحقّ الاسترجاع خلال سبعة أيام.
BEGIN;

/* ── إفصاح المحل وتوثيقه ── */
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cr_number       text;   -- السجل التجاري
ALTER TABLE stores ADD COLUMN IF NOT EXISTS vat_number      text;   -- الرقم الضريبي
ALTER TABLE stores ADD COLUMN IF NOT EXISTS maroof_number   text;   -- معروف
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_verified     boolean NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS returns_policy  text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS delivery_fee    numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS free_delivery_over numeric(10,2);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS commission_pct  numeric(5,2) NOT NULL DEFAULT 0;

/* ── قائمة انتظار المنتج النافد: أصدق مؤشّر طلب نملكه ── */
CREATE TABLE IF NOT EXISTS stock_alerts (
  id         serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  phone      text NOT NULL,
  notified   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, phone)
);

/* ── أسئلة الزوار على المنتج، يجيب عنها المحل ── */
CREATE TABLE IF NOT EXISTS questions (
  id          serial PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id    integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'زائر',
  body        text NOT NULL,
  answer      text,
  answered_at timestamptz,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_product_idx ON questions(product_id) WHERE status = 'published';

/* ── ردّ المحل على التقييم: لا يُحذف تقييم، بل يُردّ عليه ── */
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply      text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_at timestamptz;

/* ── بوابة التاجر: حساب واحد لكل محل ── */
CREATE TABLE IF NOT EXISTS merchants (
  id            serial PRIMARY KEY,
  store_id      integer NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

/* ── رسوم التوصيل على مستوى الطلب (تُحسب من إعدادات كل محل) ── */
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee numeric(10,2) NOT NULL DEFAULT 0;

COMMIT;
