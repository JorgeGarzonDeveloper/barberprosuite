import { api } from "./api";

// Convierte base64 URL a Uint8Array (requerido por PushManager.subscribe)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data } = await api.get("/notifications/vapid-public-key");
    return data?.publicKey ?? null;
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) return null;

  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });
    return sub;
  } catch {
    return null;
  }
}

export async function sendSubscriptionToServer(
  sub: PushSubscription
): Promise<void> {
  const json = sub.toJSON();
  await api.post("/notifications/web-push/subscribe", {
    endpoint: json.endpoint,
    keys: json.keys,
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;

  // Notificar al servidor
  try {
    await api.delete("/notifications/web-push/unsubscribe", {
      data: { endpoint: sub.endpoint },
    });
  } catch {
    // Continuar aunque falle el servidor
  }

  await sub.unsubscribe();
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
