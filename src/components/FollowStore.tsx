"use client";
import { useActionState, useState } from "react";
import { followStore } from "@/app/follow/actions";

/** «تابع المحل» — أرخص طريقة لبناء قائمة تُبلَّغ بلا تسجيل ولا تطبيق */
export default function FollowStore({ storeId, storeName }: { storeId: number; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(followStore, null as any);

  if (state?.ok) return <span className="badge open">{state.message}</span>;
  if (!open) {
    return (
      <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(true)}>
        تابع المحل
      </button>
    );
  }

  return (
    <form action={action} className="follow-row">
      <input type="hidden" name="store_id" value={storeId} />
      <input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx"
             aria-label={`جوالك لمتابعة ${storeName}`} />
      <button className="btn btn-line btn-sm" disabled={pending}>{pending ? "…" : "تابع"}</button>
      {state && !state.ok && <span className="error sm">{state.message}</span>}
    </form>
  );
}
