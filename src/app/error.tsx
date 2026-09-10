"use client";
import Link from "next/link";
import { useEffect } from "react";

/** صفحة خطأ عربية — الزائر لا يرى أثر المكدّس، ونحن نراه في السجل */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[ui] render error", error.digest ?? "", error.message);
  }, [error]);

  return (
    <div className="wrap" style={{ maxWidth: 620 }}>
      <div className="empty" style={{ marginTop: 60 }}>
        <h3>حدث خلل مؤقّت</h3>
        <p>
          تعذّر عرض هذه الصفحة الآن. جرّب مرة أخرى، وإن تكرّر الأمر أبلغنا من
          صفحة الانضمام ونصلحه.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn btn-gold" onClick={reset}>أعد المحاولة</button>
          <Link className="btn btn-line" href="/">عودة إلى المول</Link>
        </div>
        {error.digest && <p className="hint tabular" style={{ marginTop: 14 }}>رمز الخطأ: {error.digest}</p>}
      </div>
    </div>
  );
}
