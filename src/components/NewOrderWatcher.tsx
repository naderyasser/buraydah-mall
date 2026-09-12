"use client";
import { useEffect, useState } from "react";
import { merchantNewCount } from "@/app/merchant/actions";

/**
 * التاجر لا يملك تطبيقاً ولا إشعارات دفع: ما دامت البوابة مفتوحة في تبويب،
 * نسأل الخادم كل دقيقة ونعلّم العنوان والشارة — كما يفعل تطبيق سلة للتاجر.
 */
export default function NewOrderWatcher({ initial }: { initial: number }) {
  const [n, setN] = useState(initial);
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    const tick = async () => {
      try {
        const c = await merchantNewCount();
        setN(c);
        document.title = c > 0 ? `(${c}) ${base}` : base;
      } catch {}
    };
    const id = setInterval(tick, 60_000);
    tick();
    return () => { clearInterval(id); document.title = base; };
  }, []);
  if (n <= 0) return null;
  return <span className="nav-badge tabular" aria-label={`${n} طلبات جديدة`}>{n}</span>;
}
