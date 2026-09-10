-- المرحلة الثالثة: ما تعلّمناه من حراج وجرير ونون وسلة وزد.
-- كل جدول هنا مأخوذ من آلية عمل مثبتة في السوق السعودي، لا من تخمين.
BEGIN;

/* ── طلبات الشراء المعاكسة (نموذج حراج): الزبون ينشر ما يريد والمحلات تعرض ──
   أنسب ما يكون لسوق محلي صغير: يكشف الطلب قبل أن نملك بضاعته. */
CREATE TABLE IF NOT EXISTS buy_requests (
  id          serial PRIMARY KEY,
  token       text UNIQUE NOT NULL,
  wing_id     integer REFERENCES wings(id) ON DELETE SET NULL,
  title       text NOT NULL,
  body        text,
  budget_max  numeric(10,2),
  customer_name text NOT NULL,
  phone       text NOT NULL,
  district    text,
  status      text NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','closed','rejected')),
  expires_on  date NOT NULL DEFAULT (current_date + 30),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS buy_requests_open_idx ON buy_requests(wing_id, created_at DESC)
  WHERE status = 'open';

CREATE TABLE IF NOT EXISTS buy_offers (
  id         serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES buy_requests(id) ON DELETE CASCADE,
  store_id   integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  price      numeric(10,2),
  note       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, store_id)
);

/* ── المتابعة والتنبيهات: متابعة محل أو كلمة بحث ── */
CREATE TABLE IF NOT EXISTS follows (
  id         serial PRIMARY KEY,
  phone      text NOT NULL,
  store_id   integer REFERENCES stores(id) ON DELETE CASCADE,
  term       text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (store_id IS NOT NULL OR term IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS follows_store_idx ON follows(phone, store_id)
  WHERE store_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS follows_term_idx ON follows(phone, term)
  WHERE term IS NOT NULL;

/* ── حماية الدفع عند الاستلام: آفته الأولى رفض الاستلام المتكرّر.
   قائمة داخلية لا تُنشر (نشر أرقام الناس مخاطرة خصوصية وسمعة). ── */
CREATE TABLE IF NOT EXISTS phone_flags (
  phone      text PRIMARY KEY,
  refusals   integer NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  reason     text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refused boolean NOT NULL DEFAULT false;

/* ── التسويات: مع الدفع عند الاستلام يتحصّل المحل ويوردّ العمولة،
   فالمحفظة تصير شاشة مبكّرة لا متأخّرة. ── */
CREATE TABLE IF NOT EXISTS settlements (
  id           serial PRIMARY KEY,
  store_id     integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end   date NOT NULL,
  gross        numeric(12,2) NOT NULL DEFAULT 0,
  commission   numeric(12,2) NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid')),
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, period_start, period_end)
);

/* ── الترقية: مدفوعة بالمال أو مستحقّة بالجدارة (نموذج حراج المزدوج) ── */
CREATE TABLE IF NOT EXISTS promotions (
  id         serial PRIMARY KEY,
  store_id   integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  kind       text NOT NULL DEFAULT 'pin' CHECK (kind IN ('pin','boost')),
  wing_id    integer REFERENCES wings(id) ON DELETE CASCADE,
  starts_on  date NOT NULL DEFAULT current_date,
  ends_on    date NOT NULL,
  price      numeric(10,2) NOT NULL DEFAULT 0,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS promotions_live_idx ON promotions(store_id, ends_on);

-- تثبيت بالجدارة وشارة التاجر: تُحسبان من التقييمات لا تُشترَيان
ALTER TABLE stores ADD COLUMN IF NOT EXISTS merit_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS badge_year   integer;

/* ── وعد الجاهزية (نمط جرير: رقم وساعة قطع، لا وعد مطّاط) ── */
ALTER TABLE stores ADD COLUMN IF NOT EXISTS ready_minutes integer NOT NULL DEFAULT 60;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS hold_days     integer NOT NULL DEFAULT 3;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS lat numeric(9,6);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS lng numeric(9,6);

/* ── الضمان على مستوى المنتج (١٢ شهر ضمان من الوكيل / ضمان العيار والوزن) ── */
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty text;

/* ── حدود الكوبون كما في سلة: سقف الخصم وأول طلب فقط ── */
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount     numeric(10,2);
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS first_order_only boolean NOT NULL DEFAULT false;

/* ── مهلة المراجعة وسببها: يُعلن للتاجر بدل الصمت ── */
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS reject_reason text;
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS reviewed_at   timestamptz;

COMMIT;
