-- مول بريدة الإلكتروني — مخطط قاعدة البيانات (المرحلة 1)

CREATE TABLE IF NOT EXISTS wings (
  id          serial PRIMARY KEY,
  slug        text UNIQUE NOT NULL,
  name_ar     text NOT NULL,
  name_en     text,
  tagline     text,
  sort_order  integer NOT NULL DEFAULT 100,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- نوع الوجهة: قرار «محلي» يعني أن المحل قد لا يملك موقعاً أصلاً
CREATE TABLE IF NOT EXISTS stores (
  id              serial PRIMARY KEY,
  slug            text UNIQUE NOT NULL,
  wing_id         integer NOT NULL REFERENCES wings(id) ON DELETE RESTRICT,
  name_ar         text NOT NULL,
  name_en         text,
  logo_path       text,
  summary_ar      text,
  dest_type       text NOT NULL DEFAULT 'whatsapp'
                  CHECK (dest_type IN ('whatsapp','store','website','instagram','snapchat','map')),
  dest_value      text NOT NULL,
  whatsapp_text   text,
  address_line    text,
  district        text,
  city            text NOT NULL DEFAULT 'بريدة',
  map_url         text,
  phone           text,
  hours           jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags            text[] NOT NULL DEFAULT '{}',
  tier            text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','paid','featured')),
  sort_order      integer NOT NULL DEFAULT 100,
  is_active       boolean NOT NULL DEFAULT true,
  data_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stores_wing_idx ON stores(wing_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS stores_tags_idx ON stores USING gin(tags);

-- العمود الفقري التجاري: كل نقرة تُسجَّل قبل التحويل
CREATE TABLE IF NOT EXISTS clicks (
  id         bigserial PRIMARY KEY,
  store_id   integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  wing_id    integer NOT NULL REFERENCES wings(id) ON DELETE CASCADE,
  dest_type  text NOT NULL,
  device     text,
  referrer   text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clicks_store_time_idx ON clicks(store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS join_requests (
  id           serial PRIMARY KEY,
  store_name   text NOT NULL,
  contact_name text,
  phone        text NOT NULL,
  wing_id      integer REFERENCES wings(id) ON DELETE SET NULL,
  note         text,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','published','rejected')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS error_reports (
  id         serial PRIMARY KEY,
  store_id   integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  field      text,
  note       text,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new','fixed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
