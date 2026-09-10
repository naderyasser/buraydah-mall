-- طلبات شراء تجريبية — تُحذف بـ demo_cleanup.sql قبل الإطلاق
BEGIN;
INSERT INTO buy_requests (token, wing_id, title, body, budget_max, customer_name, phone, district)
SELECT replace(gen_random_uuid()::text,'-',''), w.id, v.title, v.body, v.budget, v.who, '0550000000', v.hay
FROM (VALUES
 ('gold','طقم زواج ذهب عيار 21 وزن 40 جرام','أبحث عن طقم كامل (عقد وأسورة وخاتم) بتصميم خليجي هادئ.',18000,'أبو فيصل','الصفراء'),
 ('fabrics','قماش عباية صيفي خفيف لا يكرمش','أحتاج 6 أمتار، ويفضّل مع خدمة تفصيل داخل بريدة.',600,'أم عبدالله','النخيل'),
 ('watches','ساعة رجالية كلاسيكية بسوار جلد','هدية تخرّج — يهمّني الضمان أكثر من الماركة.',2500,'سعود ع.','الخبيب'),
 ('clothing','ثوب صيفي قطن تفصيل','مقاس 56، أحتاجه خلال أسبوع قبل مناسبة.',450,'فهد م.','الرحاب')
) AS v(wing, title, body, budget, who, hay)
JOIN wings w ON w.slug = v.wing
WHERE NOT EXISTS (SELECT 1 FROM buy_requests b WHERE b.title = v.title);
COMMIT;
