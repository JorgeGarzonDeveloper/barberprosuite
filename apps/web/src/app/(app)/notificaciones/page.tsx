"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Bell, Calendar, Users, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

const NOTIF_ICONS: Record<string, any> = {
  APPOINTMENT_CONFIRMED: { icon: Calendar, color: "#60a5fa" },
  APPOINTMENT_CANCELLED: { icon: Calendar, color: "#f87171" },
  APPOINTMENT_REMINDER: { icon: Calendar, color: "#f59e0b" },
  QUEUE_CALLED: { icon: Users, color: "#c9a227" },
  QUEUE_POSITION_UPDATE: { icon: Users, color: "#60a5fa" },
  PAYMENT_SUCCESS: { icon: CreditCard, color: "#4ade80" },
  SUBSCRIPTION_ACTIVE: { icon: CheckCircle, color: "#4ade80" },
  SUBSCRIPTION_EXPIRING: { icon: AlertCircle, color: "#f59e0b" },
  GENERAL: { icon: Bell, color: "#c9a227" },
};

function timeAgo(d: string) {
  const secs = (Date.now() - new Date(d).getTime()) / 1000;
  if (secs < 60) return "Hace un momento";
  if (secs < 3600) return `Hace ${Math.floor(secs / 60)} min`;
  if (secs < 86400) return `Hace ${Math.floor(secs / 3600)}h`;
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function NotificacionesPage() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications?limit=50").then((r) => r.data.data?.notifications ?? []),
    retry: false,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notifications-unread"] }); },
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notifications-unread"] }); },
  });

  const notifications: any[] = Array.isArray(data) ? data : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-white/40 text-sm mt-0.5">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => readAllMutation.mutate()}
            className="text-[#c9a227] text-sm font-medium hover:underline">
            Marcar todas leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Bell className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.GENERAL;
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                onClick={() => { if (!n.isRead) readMutation.mutate(n.id); }}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${n.isRead ? "bg-white/3 border-white/5" : "bg-white/8 border-white/15 hover:border-[#c9a227]/30"}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${cfg.color}20` }}>
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.isRead ? "text-white/60" : "text-white"}`}>{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#c9a227] flex-shrink-0 mt-1" />}
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed ${n.isRead ? "text-white/30" : "text-white/60"}`}>{n.body}</p>
                  <p className="text-white/20 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
