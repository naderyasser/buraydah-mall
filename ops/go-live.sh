#!/bin/bash
# قلب المول من «نسخة تجريبية» إلى إنتاج حقيقي.
# لا يُشغَّل إلا بعد إدخال المحلات والمنتجات الحقيقية من /admin —
# إطفاء الشريط والبيانات وهمية يعني عرض محلات لا وجود لها على أنها حقيقية.
set -euo pipefail
APP=/home/frappeuser/buraydah-mall
cd "$APP"

DB_URL=$(grep -m1 '^DATABASE_URL=' .env.local | cut -d= -f2-)

REAL=$(psql "$DB_URL" -Atc "SELECT count(*) FROM stores WHERE is_active AND cr_number IS NOT NULL AND cr_number NOT LIKE '11%';")
echo "محلات بسجل تجاري حقيقي: $REAL"
if [ "${1:-}" != "--force" ] && [ "$REAL" -lt 5 ]; then
  echo "توقّف: أقل من ٥ محلات حقيقية. أدخل المحلات أولاً، أو مرّر --force إن كنت متأكداً." >&2
  exit 1
fi

echo "١) نسخة احتياطية قبل أي حذف"
/usr/local/bin/buraydah-backup.sh

echo "٢) حذف المحتوى التجريبي"
psql "$DB_URL" -f src/db/demo_cleanup.sql

echo "٣) إطفاء شريط النسخة التجريبية"
sed -i '/^NEXT_PUBLIC_DEMO_BANNER=/d' .env.local

echo "٤) إعادة البناء والتشغيل"
sudo -u frappeuser npm run build
systemctl restart buraydah-mall
sleep 6
curl -fsS -o /dev/null http://127.0.0.1:3050/api/health && echo "الموقع حيّ ✓"

echo "تم. راجع الرئيسية وتأكّد أن الشريط اختفى وأن المحلات كلها حقيقية."
