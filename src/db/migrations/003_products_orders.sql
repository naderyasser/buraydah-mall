-- المول يصير مولاً: منتجات بأسعار، سلة موحّدة، وطلب يُقسَّم على التجار
BEGIN;

CREATE TABLE IF NOT EXISTS products (
  id             serial PRIMARY KEY,
  slug           text UNIQUE NOT NULL,
  store_id       integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name_ar        text NOT NULL,
  description_ar text,
  price          numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_price  numeric(10,2),
  image_path     text,
  unit           text,
  tags           text[] NOT NULL DEFAULT '{}',
  in_stock       boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 100,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_store_idx ON products(store_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS products_tags_idx ON products USING gin(tags);

CREATE TABLE IF NOT EXISTS orders (
  id           serial PRIMARY KEY,
  code         text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  phone        text NOT NULL,
  district     text,
  fulfilment   text NOT NULL DEFAULT 'pickup' CHECK (fulfilment IN ('pickup','delivery')),
  note         text,
  total        numeric(12,2) NOT NULL,
  items_count  integer NOT NULL,
  stores_count integer NOT NULL,
  status       text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','done','cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_time_idx ON orders(created_at DESC);

-- كل محل يؤكّد نصيبه من الطلب وحده — هذا هو واقع المول
CREATE TABLE IF NOT EXISTS order_items (
  id         serial PRIMARY KEY,
  order_id   integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id   integer NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  product_id integer REFERENCES products(id) ON DELETE SET NULL,
  name_ar    text NOT NULL,
  price      numeric(10,2) NOT NULL,
  qty        integer NOT NULL CHECK (qty > 0),
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new','confirmed','done','cancelled'))
);
CREATE INDEX IF NOT EXISTS order_items_store_idx ON order_items(store_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

COMMIT;
