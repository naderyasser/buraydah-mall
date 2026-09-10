"use client";

/** آخر خط دفاع: خطأ في التخطيط نفسه، فلا نعتمد على أي نمط من الموقع */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F4F6F8", color: "#16202B",
                     display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <h1 style={{ fontSize: 22, marginBottom: 10 }}>تعذّر تحميل مول بريدة</h1>
          <p style={{ color: "#67788A", lineHeight: 1.9 }}>
            خلل مؤقّت في الخادم. أعد المحاولة بعد لحظات.
          </p>
          <button onClick={reset}
            style={{ marginTop: 16, padding: "11px 22px", border: 0, borderRadius: 10,
                     background: "#0B7A4B", color: "#fff", fontSize: 15, cursor: "pointer" }}>
            أعد المحاولة
          </button>
          {error.digest && <p style={{ color: "#93A3B4", fontSize: 12, marginTop: 14 }}>{error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
