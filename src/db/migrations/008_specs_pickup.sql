-- المواصفات ورمز الاستلام: رمز الاستلام يعوّض غياب الدفع الإلكتروني
-- (نمط «رمز الاستلام من المعرض» في جرير) — يُطابقه المحل قبل التسليم.
BEGIN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE orders   ADD COLUMN IF NOT EXISTS pickup_code text;
UPDATE orders SET pickup_code = lpad((1000 + (random()*8999)::int)::text, 4, '0') WHERE pickup_code IS NULL;
COMMIT;
