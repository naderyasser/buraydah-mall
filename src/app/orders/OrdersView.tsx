"use client";
import Link from "next/link";
import Riyal from "@/components/Riyal";
import { useEffect, useState } from "react";
import { ordersByTokens } from "@/app/order/actions";
import { leadsByTokens } from "@/app/lead/actions";
import { LEADS_KEY } from "@/components/LeadForm";
import { ORDERS_KEY } from "@/components/RememberOrder";
import { sar } from "@/lib/money";
import { agoAr } from "@/lib/time";

const LABEL: Record<string, string> = { new: "قيد المراجعة", confirmed: "مؤكَّد", ready: "جاهز / في الطريق", done: "مكتمل", cancelled: "ملغى" };

const LEAD_LABEL: Record<string, string> = { new: "وصل للماركة", contacted: "تواصلت معك", done: "تمّ", spam: "" };

export default function OrdersView() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof ordersByTokens>> | null>(null);
  const [leads, setLeads] = useState<Awaited<ReturnType<typeof leadsByTokens>>>([]);

  useEffect(() => {
    let tokens: string[] = []; let lt: string[] = [];
    try { tokens = (JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]") as { token: string }[]).map((o) => o.token); } catch {}
    try { lt = (JSON.parse(localStorage.getItem(LEADS_KEY) || "[]") as { token: string }[]).map((o) => o.token); } catch {}
    if (lt.length) leadsByTokens(lt).then(setLeads).catch(() => {});
    if (tokens.length === 0) { setRows([]); return; }
    ordersByTokens(tokens).then(setRows).catch(() => setRows([]));
  }, []);

  if (rows === null) return <p className="hint">جارٍ التحميل…</p>;
  const leadList = leads.length > 0 && (
    <div className="orders-list" style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 18 }}>طلباتي من الماركات</h2>
      {leads.map((l) => (
        <Link href={`/store/${l.store_slug}`} className="order-row" key={l.token}>
          <div><b>{l.store}</b><span className="hint"> · {agoAr(l.created_at)}{l.product ? ` · ${l.product}` : ""}</span>{l.message && <div className="hint">«{l.message}»</div>}</div>
          <span className={`badge st-${l.status === "new" ? "new" : l.status === "contacted" ? "confirmed" : "done"}`}>{LEAD_LABEL[l.status] ?? l.status}</span>
        </Link>
      ))}
    </div>
  );
  if (rows.length === 0 && leads.length === 0) {
    return (
      <div className="empty">
        <p>لا طلبات على هذا الجهاز بعد.</p>
        <Link href="/" className="btn">تسوّق الآن</Link>
      </div>
    );
  }
  return (
    <>
    {leadList}
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
    </>
  );
}
