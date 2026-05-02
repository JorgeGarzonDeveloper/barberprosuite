"use client";

import { useEffect, useRef } from "react";
import {
  subscribeToPush,
  sendSubscriptionToServer,
  getCurrentPushSubscription,
} from "@/lib/push";

/**
 * Se llama después de que el usuario está autenticado.
 * Pide permiso, se suscribe a web push y registra en el servidor.
 * Solo intenta una vez por sesión (usando sessionStorage como flag).
 */
export function usePushNotifications(isAuthenticated: boolean) {
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (attempted.current) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    // Ya se intentó en esta sesión del navegador
    if (sessionStorage.getItem("push-subscribed")) return;

    attempted.current = true;

    async function setup() {
      try {
        // Si ya tiene suscripción activa, solo registrarla en el servidor
        const existing = await getCurrentPushSubscription();
        if (existing) {
          await sendSubscriptionToServer(existing).catch(() => {});
          sessionStorage.setItem("push-subscribed", "1");
          return;
        }

        // Si el permiso ya fue denegado, no volver a preguntar
        if (Notification.permission === "denied") return;

        // Suscribir (pedirá permiso al usuario si está en "default")
        const sub = await subscribeToPush();
        if (sub) {
          await sendSubscriptionToServer(sub).catch(() => {});
          sessionStorage.setItem("push-subscribed", "1");
        }
      } catch {
        // Silencioso: no romper la app si falla
      }
    }

    // Pequeño delay para no bloquear la carga inicial
    const timer = setTimeout(setup, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
}
