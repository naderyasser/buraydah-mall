/* عامل خدمة بوابة التاجر: يستقبل إشعار الدفع ويعرضه، والضغط يفتح صفحة الطلبات */
self.addEventListener("push", (e) => {
  let d = { title: "مول بريدة", body: "طلب جديد", url: "/merchant/orders" };
  try { d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, icon: "/logo-mark.png", badge: "/logo-mark.png", dir: "rtl", lang: "ar", tag: d.tag || "order", renotify: true, data: { url: d.url },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/merchant/orders";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if ("focus" in w) { w.navigate(url); return w.focus(); }
    return clients.openWindow(url);
  }));
});
