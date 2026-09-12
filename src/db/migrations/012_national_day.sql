-- موسم اليوم الوطني ٩٦ (٢٠٢٦-٠٩-١٢): كوبون موحّد للمول + فهرس لكنس العروض المنتهية
INSERT INTO coupons (code, store_id, kind, value, min_total, expires_on, is_active)
SELECT 'KSA96', NULL, 'percent', 10, 0, DATE '2026-09-24', true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE upper(code) = 'KSA96');
CREATE INDEX IF NOT EXISTS products_sale_ends ON products (sale_ends_at) WHERE sale_ends_at IS NOT NULL;
