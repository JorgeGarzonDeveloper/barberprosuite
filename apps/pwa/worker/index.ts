/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// ── Push notification handler ─────────────────────────────────────────────

self.addEventListener("push", (event: PushEvent) => {
  let data: { title?: string; body?: string; data?: Record<string, string> } = {};

  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "BarberProSuite", body: event.data?.text() ?? "" };
  }

  const title = data.title || "BarberProSuite";
  const options: NotificationOptions = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: data.data ?? {},
    vibrate: [200, 100, 200],
    tag: "barberprosuite-push",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click handler ────────────────────────────────────────────

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data as any)?.url || "/home";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Si la app ya está abierta, enfocarla y navegar
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            (client as WindowClient).navigate(url);
            return;
          }
        }
        // Si no está abierta, abrir nueva ventana
        return self.clients.openWindow(url);
      })
  );
});
