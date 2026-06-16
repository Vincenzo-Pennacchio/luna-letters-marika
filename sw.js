const CACHE = "luna-letters-marika-v2";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()))
);
self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isHTML = e.request.mode === "navigate" ||
    e.request.headers.get("accept")?.includes("text/html");
  if (isHTML) {
    // Network-first for HTML so new deploys are picked up immediately.
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(c => c || caches.match("./index.html")))
    );
    return;
  }
  // Cache-first for other static assets.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window"}).then(cs => {
    if(cs.length) return cs[0].focus();
    return clients.openWindow("./");
  }));
});