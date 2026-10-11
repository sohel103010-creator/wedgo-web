self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
self.addEventListener("fetch", (e) => {
  // Network first, fallback to cache
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// Web push notifications
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data.json(); } catch (_) {}
  const title = data.title || "WedGo";
  e.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/chat" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/chat";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        try {
          if (new URL(c.url).pathname === url) return c.focus();
        } catch (_) {}
      }
      return clients.openWindow(url);
    })
  );
});
