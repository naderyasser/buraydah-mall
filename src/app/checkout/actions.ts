"use server";
import { q, q1, pool } from "@/db";

type Line = { productId: number; qty: number };

/**
 * الأسعار تُعاد قراءتها من قاعدة البيانات ولا تُؤخذ من المتصفّح أبداً:
 * السلة تعيش في جهاز الزائر، فكل رقم قادم منها غير موثوق.
 */
export async function placeOrder(_prev: unknown, form: FormData) {
  const name = String(form.get("customer_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const fulfilment = String(form.get("fulfilment") ?? "pickup");
  const district = String(form.get("district") ?? "").trim() || null;
  const note = String(form.get("note") ?? "").trim() || null;

  if (name.length < 2) return { ok: false as const, message: "اكتب اسمك." };
  if (!/^0?5\d{8}$/.test(phone.replace(/\s|-/g, "")))
    return { ok: false as const, message: "رقم الجوال غير صحيح — الصيغة 05xxxxxxxx." };

  let lines: Line[] = [];
  try {
    lines = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { ok: false as const, message: "تعذّرت قراءة السلة. حدّث الصفحة وحاول مرة أخرى." };
  }
  lines = lines.filter((l) => Number.isInteger(l.productId) && l.qty > 0 && l.qty <= 99);
  if (lines.length === 0) return { ok: false as const, message: "سلتك فارغة." };

  const ids = lines.map((l) => l.productId);
  const products = await q<{ id: number; store_id: number; name_ar: string; price: string }>(
    `SELECT id, store_id, name_ar, price FROM products WHERE id = ANY($1) AND is_active AND in_stock`,
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

  const priced = lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)!;
    return { ...l, store_id: p.store_id, name_ar: p.name_ar, price: Number(p.price) };
  });

  const total = priced.reduce((n, l) => n + l.price * l.qty, 0);
  const itemsCount = priced.reduce((n, l) => n + l.qty, 0);
  const storesCount = new Set(priced.map((l) => l.store_id)).size;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // جملتان لا CTE واحد: في PostgreSQL لا ترى جملة UPDATE الصفَّ الذي
    // أدرجه CTE في نفس العبارة، فيعود RETURNING فارغاً.
    // الرقم المعروض متسلسل، أما رابط التأكيد فبرمز عشوائي: الرابط المتسلسل
    // كان يُخمَّن بالعدّ فيكشف اسم كل عميل وجواله.
    const ins = await client.query(
      `INSERT INTO orders (code, token, customer_name, phone, district, fulfilment, note,
                           total, items_count, stores_count)
       VALUES ('tmp-' || gen_random_uuid(), replace(gen_random_uuid()::text,'-',''),
               $1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [name, phone, district, fulfilment, note, total, itemsCount, storesCount]
    );
    const orderId = ins.rows[0].id as number;
    const upd = await client.query(
      `UPDATE orders SET code = $1 WHERE id = $2 RETURNING id, code, token`,
      [`BRD-${1000 + orderId}`, orderId]
    );
    const order = upd.rows[0] as { id: number; code: string; token: string };

    for (const l of priced) {
      await client.query(
        `INSERT INTO order_items (order_id, store_id, product_id, name_ar, price, qty)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, l.store_id, l.productId, l.name_ar, l.price, l.qty]
      );
    }
    await client.query("COMMIT");
    return { ok: true as const, code: order.code, token: order.token, message: "تم" };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[checkout] order failed", err);
    return { ok: false as const, message: "تعذّر حفظ الطلب. حاول مرة أخرى بعد قليل." };
  } finally {
    client.release();
  }
}
