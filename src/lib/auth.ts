import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "mall_admin";
const MAX_AGE = 60 * 60 * 12;

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function makeToken(): string {
  const exp = Date.now() + MAX_AGE * 1000;
  return `${exp}.${sign(String(exp))}`;
}

export function verifyToken(token?: string): boolean {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  if (expected.length !== mac.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(mac));
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME || "admin";
  const p = process.env.ADMIN_PASSWORD || "";
  return username === u && p.length > 0 && password === p;
}

export async function isLoggedIn(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

export async function setSession() {
  const jar = await cookies();
  jar.set(COOKIE, makeToken(), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
