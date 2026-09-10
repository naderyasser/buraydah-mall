"use client";
import { useActionState } from "react";

type Result = { ok: boolean; message: string } | null;

export default function SubmitForm({
  action, children, submitLabel,
}: {
  action: (prev: unknown, form: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null as Result);

  if (state?.ok) {
    return (
      <div className="panel" style={{ borderColor: "var(--ok)" }}>
        <p style={{ margin: 0, color: "var(--ok)" }}>{state.message}</p>
      </div>
    );
  }
  return (
    <form action={formAction} className="panel form">
      {children}
      {state && !state.ok && (
        <p style={{ color: "var(--crit)", fontSize: 14, margin: "4px 0 0" }}>{state.message}</p>
      )}
      <button className="btn btn-brand" type="submit" disabled={pending}>
        {pending ? "جارٍ الإرسال…" : submitLabel}
      </button>
    </form>
  );
}
