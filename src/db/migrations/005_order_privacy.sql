-- خصوصية الطلب: رابط التأكيد كان يُخمَّن بالعدّ (BRD-1001, 1002…)
-- فيكشف اسم العميل وجواله. الرقم يبقى للعرض، والرابط يصير برمز عشوائي.
BEGIN;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS token text;
UPDATE orders SET token = replace(gen_random_uuid()::text, '-', '') WHERE token IS NULL;
ALTER TABLE orders ALTER COLUMN token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_token_idx ON orders(token);

COMMIT;
