"use client";
import { useEffect, useState } from "react";
import { savePushSubscription, removePushSubscription } from "@/app/merchant/actions";

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** تفعيل إشعارات الطلبات في متصفّح التاجر — بديل تطبيق سلة للتاجر، مجاني وبلا مزوّد */
export default function PushToggle({ vapid }: { vapid: string }) {
  const [state, setState] = useState<"unsupported" | "off" | "on" | "denied" | "busy">("busy");
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState("unsupported");
    if (Notification.permission === "denied") return setState("denied");
    navigator.serviceWorker.register("/sw.js").then((r) => r.pushManager.getSubscription()).then((s) => setState(s ? "on" : "off")).catch(() => setState("unsupported"));
  }, []);
  async function enable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(vapid) });
      const j = sub.toJSON();
      await savePushSubscription({ endpoint: sub.endpoint, p256dh: j.keys!.p256dh, auth: j.keys!.auth });
      setState("on");
    } catch { setState(Notification.permission === "denied" ? "denied" : "off"); }
  }
  async function disable() {
    setState("busy");
    try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
      if (sub) { await removePushSubscription(sub.endpoint); await sub.unsubscribe(); } } catch {}
    setState("off");
  }
  if (state === "unsupported") return <p className="hint">متصفّحك لا يدعم الإشعارات — على آيفون أضف البوابة إلى الشاشة الرئيسية أولاً.</p>;
  if (state === "denied") return <p className="hint">الإشعارات محظورة في إعدادات المتصفّح لهذا الموقع.</p>;
  return (
    <div className="push-toggle">
      {state === "on"
        ? <><span className="badge st-confirmed">الإشعارات مفعّلة على هذا الجهاز</span><button type="button" className="btn btn-line btn-sm" onClick={disable}>إيقاف</button></>
        : <button type="button" className="btn btn-brand btn-sm" onClick={enable} disabled={state === "busy"}>{state === "busy" ? "…" : "فعّل إشعارات الطلبات على هذا الجهاز"}</button>}
    </div>
  );
}
