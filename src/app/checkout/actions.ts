"use server";
import { q, q1, pool } from "@/db";
import { tooMany, RATE } from "@/lib/ratelimit";
import { pushToStore } from "@/lib/push";

type Line = { productId: number; variantId?: number | null; qty: number };

const money = (n: number) => Math.round(n * 100) / 100;

/**
 * الأسعار تُعاد قراءتها من قاعدة البيانات ولا تُؤخذ من المتصفّح أبداً:
 * السلة تعيش في جهاز الزائر، فكل رقم قادم منها غير موثوق — والخيار
 * (المقاس/العيار) يُتحقّق من انتمائه للمنتج قبل أن يُسعّر.
 */
export async function placeOrder(_prev: unknown, form: FormData) {
  if (await tooMany("order", RATE.order.limit, RATE.order.windowMs))
    return { ok: false as const, message: RATE.order.msg };

  const name = String(form.get("customer_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const fulfilment = String(form.get("fulfilment") ?? "pickup");
  const district = String(form.get("district") ?? "").trim() || null;
  const note = String(form.get("note") ?? "").trim() || null;
  const couponCode = String(form.get("coupon") ?? "").trim().toUpperCase() || null;

  if (name.length < 2) return { ok: false as const, message: "اكتب اسمك." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false as const, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };
  if (fulfilment === "delivery" && !district)
    return { ok: false as const, message: "اكتب الحي ليصلك الطلب." };

  // آفة الدفع عند الاستلام الأولى: رفض الاستلام المتكرّر. القائمة داخلية
  // ولا تُنشر — نشر أرقام الناس مخاطرة خصوصية وسمعة.
  const flag = await q1<{ is_blocked: boolean }>(
    `SELECT is_blocked FROM phone_flags WHERE phone = $1`,
    [phone.replace(/\s|-/g, "")]
  );
  if (flag?.is_blocked) {
    return {
      ok: false as const,
      message: "تعذّر إرسال الطلب من هذا الرقم. تواصل مع إدارة المول من صفحة الانضمام.",
    };
  }

  let lines: Line[] = [];
  try {
    lines = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { ok: false as const, message: "تعذّرت قراءة السلة. حدّث الصفحة وحاول مرة أخرى." };
  }
  lines = lines.filter((l) => Number.isInteger(l.productId) && l.qty > 0 && l.qty <= 99);
  if (lines.length === 0) return { ok: false as const, message: "سلتك فارغة." };

  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = await q<{
    id: number; store_id: number; name_ar: string; price: string;
    delivery_fee: string; free_delivery_over: string | null; store_name: string;
  }>(
    `SELECT p.id, p.store_id, p.name_ar, p.price,
            s.delivery_fee, s.free_delivery_over, s.name_ar AS store_name
     FROM products p JOIN stores s ON s.id = p.store_id
     WHERE p.id = ANY($1) AND p.is_active AND p.in_stock AND s.is_active`,
    [ids]
  );

  // منتج نفد أو أُخفي لا يسقط بالصمت: الطلب يتوقّف ويُسمّى المنتج للعميل،
  // وإلا استلم تأكيداً بإجمالي غير الذي وافق عليه.
  const missing = ids.filter((id) => !products.some((p) => p.id === id));
  if (missing.length > 0) {
    const named = await q<{ id: number; name_ar: string }>(
      `SELECT id, name_ar FROM products WHERE id = ANY($1)`,
      [missing]
    );
    const names = missing.map((id) => named.find((n) => n.id === id)?.name_ar ?? `منتج #${id}`);
    return {
      ok: false as const,
      unavailable: missing,
      message:
        missing.length === ids.length
          ? "لم تعد منتجات سلتك متاحة الآن. احذفها من السلة واختر غيرها."
          : `نفد من المحل: ${names.join("، ")}. احذفه من السلة ثم أعد الإرسال.`,
    };
  }

  const variantIds = lines.map((l) => l.variantId).filter((v): v is number => Number.isInteger(v as number));
  const variants = variantIds.length
    ? await q<{ id: number; product_id: number; name_ar: string; extra_price: string; in_stock: boolean }>(
        `SELECT id, product_id, name_ar, extra_price, in_stock FROM product_variants WHERE id = ANY($1)`,
        [variantIds]
      )
    : [];

  const priced: (Line & { store_id: number; name_ar: string; price: number; variant_name: string | null })[] = [];
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId)!;
    let extra = 0;
    let vname: string | null = null;
    if (l.variantId) {
      const v = variants.find((x) => x.id === l.variantId && x.product_id === l.productId);
      if (!v || !v.in_stock) {
        return { ok: false as const, message: `الخيار المختار من «${p.name_ar}» لم يعد متوفّراً. راجع سلتك.` };
      }
      extra = Number(v.extra_price);
      vname = v.name_ar;
    }
    priced.push({ ...l, store_id: p.store_id, name_ar: p.name_ar, price: money(Number(p.price) + extra), variant_name: vname });
  }

  const subtotal = money(priced.reduce((n, l) => n + l.price * l.qty, 0));
  const itemsCount = priced.reduce((n, l) => n + l.qty, 0);
  const storeIds = [...new Set(priced.map((l) => l.store_id))];

  /* الخصم يُحسب على الخادم مهما أظهرت الواجهة — الرقم القادم منها غير موثوق */
  let discount = 0;
  let coupon: any = null;
  if (couponCode) {
    coupon = await q1<any>(
      `SELECT * FROM coupons WHERE upper(code) = $1 AND is_active
         AND (expires_on IS NULL OR expires_on >= current_date)
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [couponCode]
    );
    if (coupon) {
      const base = coupon.store_id
        ? money(priced.filter((l) => l.store_id === coupon.store_id).reduce((n, l) => n + l.price * l.qty, 0))
        : subtotal;
      const usedBefore = coupon.first_order_only
        ? await q1<{ n: number }>(
            `SELECT count(*)::int AS n FROM orders WHERE phone = $1 AND status <> 'cancelled'`,
            [phone]
          )
        : null;

      if (coupon.first_order_only && (usedBefore?.n ?? 0) > 0) {
        coupon = null;                       // كوبون أول طلب لمن طلب من قبل
      } else if (base >= Number(coupon.min_total)) {
        discount = coupon.kind === "percent" ? money((base * Number(coupon.value)) / 100)
                                             : Math.min(Number(coupon.value), base);
        // سقف الخصم كما في سلة: النسبة على سلة كبيرة قد تأكل هامش المحل
        if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
      } else {
        coupon = null;
      }
    }
  }

  /* التوصيل برسم كل محل، ويسقط عن المحل الذي بلغت سلّته حدّ التوصيل المجاني */
  let deliveryFee = 0;
  if (fulfilment === "delivery") {
    for (const sid of storeIds) {
      const s = products.find((p) => p.store_id === sid)!;
      const sub = priced.filter((l) => l.store_id === sid).reduce((n, l) => n + l.price * l.qty, 0);
      const freeOver = s.free_delivery_over == null ? null : Number(s.free_delivery_over);
      if (freeOver != null && sub >= freeOver) continue;
      deliveryFee += Number(s.delivery_fee);
    }
    deliveryFee = money(deliveryFee);
  }

  const total = money(subtotal - discount + deliveryFee);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // الرقم المعروض متسلسل، أما رابط التأكيد فبرمز عشوائي: الرابط المتسلسل
    // كان يُخمَّن بالعدّ فيكشف اسم كل عميل وجواله.
    const ins = await client.query(
      `INSERT INTO orders (code, token, customer_name, phone, district, fulfilment, note,
                           subtotal, discount, delivery_fee, total, items_count, stores_count,
                           coupon_code, pickup_code)
       VALUES ('tmp-' || gen_random_uuid(), replace(gen_random_uuid()::text,'-',''),
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
               lpad((1000 + (random()*8999)::int)::text, 4, '0'))
       RETURNING id`,
      [name, phone, district, fulfilment, note, subtotal, discount, deliveryFee, total,
       itemsCount, storeIds.length, coupon?.code ?? null]
    );
    const orderId = ins.rows[0].id as number;
    const upd = await client.query(
      `UPDATE orders SET code = $1 WHERE id = $2 RETURNING id, code, token, pickup_code`,
      [`BRD-${1000 + orderId}`, orderId]
    );
    const order = upd.rows[0] as { id: number; code: string; token: string; pickup_code: string };

    for (const l of priced) {
      await client.query(
        `INSERT INTO order_items (order_id, store_id, product_id, name_ar, price, qty, variant_id, variant_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, l.store_id, l.productId, l.name_ar, l.price, l.qty, l.variantId ?? null, l.variant_name]
      );
    }
    if (coupon) {
      await client.query(`UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`, [coupon.id]);
    }
    await client.query("COMMIT");
    // إشعار كل محل بنصيبه — بعد الالتزام، ولا يُنتظر ولا يُفشل الطلب إن تعطّل
    for (const sid of new Set(priced.map((l) => l.store_id))) {
      const n = priced.filter((l) => l.store_id === sid).reduce((a, l) => a + l.qty, 0);
      void pushToStore(sid, { title: `طلب جديد ${order.code}`, body: `${n} قطعة من ${name} — افتح البوابة لتأكيده`, url: "/merchant/orders", tag: order.code }).catch(() => {});
    }
    return {
      ok: true as const, code: order.code, token: order.token, message: "تم",
      customer: { name, phone, district: district ?? "", mode: fulfilment },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[checkout] order failed", err);
    return { ok: false as const, message: "تعذّر حفظ الطلب. حاول مرة أخرى بعد قليل." };
  } finally {
    client.release();
  }
}
