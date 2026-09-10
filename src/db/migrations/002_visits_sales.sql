-- عدّاد الزوار (عام) + سجل المشتريات لكل ماركة (خاص بالإدارة)
BEGIN;

-- زيارة = جلسة واحدة، لا كل صفحة. تُسجَّل من المتصفّح فتستبعد أغلب الزواحف.
CREATE TABLE IF NOT EXISTS visits (
  id         bigserial PRIMARY KEY,
  session_id text NOT NULL,
  path       text,
  device     text,
  referrer   text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS visits_time_idx ON visits(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS visits_session_idx ON visits(session_id);

-- كود المول: ما يذكره الزبون عند الشراء ليُنسب البيع للمول
ALTER TABLE stores ADD COLUMN IF NOT EXISTS coupon_code text;

-- المشتريات لا تُقاس تلقائياً — تُسجَّل شهرياً بمصدر معلوم
CREATE TABLE IF NOT EXISTS store_sales (
  id          serial PRIMARY KEY,
  store_id    integer NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  period      date NOT NULL,
  orders      integer NOT NULL DEFAULT 0,
  total_value numeric(12,2),
  source      text NOT NULL DEFAULT 'merchant'
              CHECK (source IN ('merchant','coupon','manual')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, period)
);
CREATE INDEX IF NOT EXISTS store_sales_period_idx ON store_sales(period DESC);

COMMIT;
