"use client";
import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null as { ok: boolean; message: string } | null);
  return (
    <form action={action} className="panel form">
      <label>اسم المستخدم<input name="username" required autoComplete="username" /></label>
      <label>كلمة المرور<input name="password" type="password" required autoComplete="current-password" /></label>
      {state && !state.ok && <p style={{ color: "var(--crit)", fontSize: 14, margin: 0 }}>{state.message}</p>}
      <button className="btn btn-brand" disabled={pending}>{pending ? "جارٍ الدخول…" : "دخول"}</button>
    </form>
  );
}
