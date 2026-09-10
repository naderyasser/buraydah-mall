import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __mallPool: Pool | undefined;
}

export const pool =
  global.__mallPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });

if (process.env.NODE_ENV !== "production") global.__mallPool = pool;

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function q1<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}
