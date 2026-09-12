"use server";
import { revalidatePath } from "next/cache";
import { pool, q, q1 } from "@/db";
import { tooMany, RATE } from "@/lib/ratelimit";

/**
 * إلغاء العميل لطلبه (نون/أمازون): مسموح ما دام كل نصيب فيه «جديداً» — أي لم يبدأ
 * أي محل تجهيزه. الرابط السرّي (token) هو ما يُثبت أن الطلب طلبه، كما في صفحة التأكيد.
 */
export async function cancelOrderByToken(_prev: unknown, form: FormData) {
  if (await tooMany("cancel", RATE.form.limit, RATE.form.windowMs))
    return { ok: false as const, message: RATE.form.msg };
  const token = String(form.get("token") ?? "").trim();
  if (token.length < 16) return { ok: false as const, message: "رابط غير صالح." };

  const order = await q1<{ id: number; status: string }>(`SELECT id, status FROM orders WHERE token = $1`, [token]);
  if (!order) return { ok: false as const, message: "الطلب غير موجود." };
  if (order.status === "cancelled") return { ok: true as const, message: "الطلب ملغى أصلاً." };

  const busy = await q1<{ n: number }>(
    `SELECT count(*)::int AS n FROM order_items WHERE order_id = $1 AND status NOT IN ('new','cancelled')`,
    [order.id]
  );
  if (busy && busy.n > 0)
    return { ok: false as const, message: "بدأ أحد المحلات تجهيز طلبك، فلم يعد الإلغاء من هنا ممكناً — تواصل مع المحل مباشرة." };

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query(`UPDATE order_items SET status = 'cancelled' WHERE order_id = $1`, [order.id]);
    await c.query(`UPDATE orders SET status = 'cancelled', cancelled_by = 'customer' WHERE id = $1`, [order.id]);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
  revalidatePath(`/order/${token}`);
  revalidatePath("/admin/orders");
  return { ok: true as const, message: "أُلغي طلبك. لم يُخصم منك شيء لأن الدفع عند الاستلام." };
}

/** «طلباتي» على الجهاز: الرموز السرّية محفوظة في متصفّح العميل، والخادم يعيد ملخّصها فقط */
export async function ordersByTokens(tokens: string[]) {
  const clean = [...new Set(tokens.filter((t) => typeof t === "string" && t.length >= 16))].slice(0, 20);
  if (clean.length === 0) return [];
  return q<{ token: string; code: string; status: string; total: string; items_count: number; stores_count: number; created_at: string }>(
    `SELECT token, code, status, total, items_count, stores_count, created_at
     FROM orders WHERE token = ANY($1) ORDER BY created_at DESC`,
    [clean]
  );
}
