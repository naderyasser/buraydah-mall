"use client";
import { useActionState, useState } from "react";
import { cancelOrderByToken } from "@/app/order/actions";

/** إلغاء بخطوتين داخل الصفحة لا بنافذة المتصفّح — الضغطة الأولى تسأل، والثانية تنفّذ */
export default function CancelOrder({ token }: { token: string }) {
  const [arm, setArm] = useState(false);
  const [state, action, pending] = useActionState(cancelOrderByToken, null as null | { ok: boolean; message: string });

  if (state?.ok) return <p className="notice ok">{state.message}</p>;
  return (
    <form action={action} className="cancel-order">
      <input type="hidden" name="token" value={token} />
      {!arm ? (
        <button type="button" className="btn btn-line btn-sm" onClick={() => setArm(true)}>إلغاء الطلب</button>
      ) : (
        <>
          <span>تلغي الطلب كله؟</span>
          <button type="submit" className="btn btn-danger btn-sm" disabled={pending}>{pending ? "…" : "نعم، ألغِ"}</button>
          <button type="button" className="btn btn-line btn-sm" onClick={() => setArm(false)}>تراجع</button>
        </>
      )}
      {state && !state.ok && <p className="notice err">{state.message}</p>}
    </form>
  );
}
