"use client";
import { useActionState, useState } from "react";
import { followTerm } from "@/app/follow/actions";

/** تنبيه على كلمة بحث: ما لا يجده الزائر اليوم قد يصل غداً */
export default function FollowTerm({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(followTerm, null as any);

  if (state?.ok) return <p className="ok-note">{state.message}</p>;

  return (
    <div className="term-alert">
      {!open ? (
        <button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(true)}>
          نبّهني إذا نزل «{term}»
        </button>
      ) : (
        <form action={action} className="follow-row">
          <input type="hidden" name="term" value={term} />
          <input name="phone" required inputMode="tel" dir="ltr" placeholder="05xxxxxxxx" aria-label="جوالك" />
          <button className="btn btn-line btn-sm" disabled={pending}>{pending ? "…" : "نبّهني"}</button>
          {state && !state.ok && <span className="error sm">{state.message}</span>}
        </form>
      )}
    </div>
  );
}
