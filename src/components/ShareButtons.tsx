"use client";
import { useEffect, useState } from "react";

/** مشاركة المنتج: واتساب أولاً (هو سوق بريدة)، ثم نسخ الرابط، ومشاركة الجهاز إن وُجدت */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — مول بريدة`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const x = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  // يُقرَّر بعد الترطيب لا أثناء الرسم — وإلا اختلف HTML الخادم عن المتصفّح
  const [canShare, setCanShare] = useState(false);
  useEffect(() => { setCanShare(typeof navigator.share === "function"); }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  return (
    <div className="share">
      <span>شارك:</span>
      <a href={wa} target="_blank" rel="noopener" className="chip">واتساب</a>
      <a href={x} target="_blank" rel="noopener" className="chip">X</a>
      <button type="button" className="chip" onClick={copy}>{copied ? "نُسخ ✓" : "نسخ الرابط"}</button>
      {canShare && (
        <button type="button" className="chip" onClick={() => navigator.share({ title: text, url }).catch(() => {})}>
          مشاركة…
        </button>
      )}
    </div>
  );
}
