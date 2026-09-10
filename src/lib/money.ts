/** الأسعار بالريال السعودي — أرقام لاتينية وفواصل آلاف، والكسور تُحذف عند 0 */
export function sar(v: number | string): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!isFinite(n)) return "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
