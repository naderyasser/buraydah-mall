import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { q1 } from "@/db";

const COOKIE = "mall_merchant";
const MAX_AGE = 60 * 60 * 12;

/** scrypt بملح لكل حساب — لا كلمات مرور مخزّنة نصاً في قاعدة مشتركة */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  return `s1$${salt}$${scryptSync(pw, salt, 32).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [v, salt, hash] = stored.split("$");
  if (v !== "s1" || !salt || !hash) return false;
  const calc = scryptSync(pw, salt, 32);
  const want = Buffer.from(hash, "hex");
  return calc.length === want.length && timingSafeEqual(calc, want);
}

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return createHmac("sha256", secret).update("merchant:" + payload).digest("hex");
}

export function makeToken(storeId: number): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const body = `${storeId}.${exp}`;
  return `${body}.${sign(body)}`;
}

export function readToken(token?: string): number | null {
  if (!token) return null;
  const [sid, exp, mac] = token.split(".");
  if (!sid || !exp || !mac) return null;
  if (Number(exp) < Date.now()) return null;
  const expected = sign(`${sid}.${exp}`);
  if (expected.length !== mac.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
  const id = Number(sid);
  return Number.isInteger(id) ? id : null;
}

export async function currentStoreId(): Promise<number | null> {
  const jar = await cookies();
  return readToken(jar.get(COOKIE)?.value);
}

/** المحل الحالي مع بياناته — كل صفحة في البوابة تبدأ به */
export async function currentStore() {
  const id = await currentStoreId();
  if (!id) return null;
  return q1<any>(
    `SELECT s.*, m.username FROM stores s JOIN merchants m ON m.store_id = s.id
     WHERE s.id = $1 AND m.is_active`,
    [id]
  );
}

export async function setMerchantSession(storeId: number) {
  const jar = await cookies();
  jar.set(COOKIE, makeToken(storeId), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearMerchantSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** حارس كل صفحة في البوابة: يحوّل بدل أن يرمي — الصفحة والـlayout يُرسمان معاً فلا تعتمد على حارس الـlayout */
export async function requireStore() {
  const store = await currentStore();
  if (!store) redirect("/merchant/login");
  return store;
}
