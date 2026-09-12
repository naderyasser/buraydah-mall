"use client";
import Link from "next/link";
import Riyal from "@/components/Riyal";
import { useEffect, useState } from "react";
import { ordersByTokens } from "@/app/order/actions";
import { ORDERS_KEY } from "@/components/RememberOrder";
import { sar } from "@/lib/money";
import { agoAr } from "@/lib/time";

const LABEL: Record<string, string> = { new: "قيد المراجعة", confirmed: "مؤكَّد", done: "مكتمل", cancelled: "ملغى" };

export default function OrdersView() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof ordersByTokens>> | null>(null);

  useEffect(() => {
    let tokens: string[] = [];
    try { tokens = (JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]") as { token: string }[]).map((o) => o.token); } catch {}
    if (tokens.length === 0) { setRows([]); return; }
    ordersByTokens(tokens).then(setRows).catch(() => setRows([]));
  }, []);

  if (rows === null) return <p className="hint">جارٍ التحميل…</p>;
  if (rows.length === 0) {
    return (
      <div className="empty">
        <p>لا طلبات على هذا الجهاز بعد.</p>
        <Link href="/" className="btn">تسوّق الآن</Link>
      </div>
    );
  }
  return (
    <div className="orders-list">
      {rows.map((o) => (
        <Link href={`/order/${o.token}`} className="order-row" key={o.token}>
          <div>
            <b className="tabular">{o.code}</b>
            <span className="hint"> · {agoAr(o.created_at)} · {o.items_count} قطعة من {o.stores_count} {o.stores_count === 1 ? "محل" : "محلات"}</span>
          </div>
          <span className={`badge st-${o.status}`}>{LABEL[o.status] ?? o.status}</span>
          <b className="tabular">{sar(o.total)} <Riyal /></b>
        </Link>
      ))}
    </div>
  );
}
