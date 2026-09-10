# الاستعادة من نسخة احتياطية

النسخ في `/var/backups/buraydah-mall/` (١٤ يوماً)، تُؤخذ يومياً 3:20 فجراً
عبر `/etc/cron.d/buraydah-mall`، وسجلّها `/var/log/buraydah-backup.log`.

## استعادة القاعدة كاملة

```bash
systemctl stop buraydah-mall
DB=$(grep -m1 '^DATABASE_URL=' /home/frappeuser/buraydah-mall/.env.local | cut -d= -f2-)
pg_restore --clean --if-exists --no-owner -d "$DB" /var/backups/buraydah-mall/db-YYYY-MM-DD.dump
systemctl start buraydah-mall
```

## استعادة جدول واحد فقط (الأكثر استعمالاً)

```bash
pg_restore --data-only --table=orders -d "$DB" /var/backups/buraydah-mall/db-YYYY-MM-DD.dump
```

## استعادة الصور المرفوعة

```bash
tar -xzf /var/backups/buraydah-mall/uploads-YYYY-MM-DD.tar.gz \
    -C /home/frappeuser/buraydah-mall/public
chown -R frappeuser:frappeuser /home/frappeuser/buraydah-mall/public
```

## إعدادات ضاعت

`env-YYYY-MM-DD.local` نسخة من `.env.local` وفيها كلمات المرور — صلاحيتها 600
وللجذر وحده. انسخها مكانها وأعد التشغيل.

## نسخة خارج الصندوق

النسخ الحالية على **نفس القرص**: تحمي من الخطأ البشري وحذف الجداول، لا من
فقد الخادم. لنسخة خارجية أضف إلى cron:

```bash
rsync -az /var/backups/buraydah-mall/ user@backup-host:/srv/buraydah/
```
