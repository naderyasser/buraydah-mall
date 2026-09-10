"use client";
import Link from "next/link";
import { useActionState } from "react";
import { merchantLogin } from "../actions";

export default function MerchantLoginForm() {
  const [state, action, pending] = useActionState(merchantLogin, null as any);
  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <section className="section" style={{ paddingTop: 40 }}>
        <h1 style={{ fontSize: 26 }}>بوابة التاجر</h1>
        <p style={{ color: "var(--mut)" }}>
          ادخل لتدير طلبات محلك ومنتجاته. الحساب يُنشئه فريق المول عند اعتماد المحل.
        </p>
        <form action={action} className="panel form">
          <label>اسم المستخدم<input name="username" required autoComplete="username" dir="ltr" /></label>
          <label>كلمة المرور<input name="password" type="password" required autoComplete="current-password" /></label>
          {state && !state.ok && <p className="error">{state.message}</p>}
          <button className="btn btn-brand" disabled={pending}>{pending ? "…" : "دخول"}</button>
        </form>
        <p className="hint">
          ما عندك حساب؟ <Link href="/join">اطلب الانضمام إلى المول</Link>.
        </p>
      </section>
    </div>
  );
}
