"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { PageSpinner } from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  Bell, Users, Calendar, CreditCard, CheckCircle,
  AlertCircle, Scissors, Clock,
} from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  QUEUE_JOINED:         { icon: Users,       color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  QUEUE_CALLED:         { icon: Users,       color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  QUEUE_POSITION_UPDATE:{ icon: Clock,       color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  APPOINTMENT_BOOKED:   { icon: Calendar,    color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  APPOINTMENT_CONFIRMED:{ icon: Calendar,    color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  APPOINTMENT_CANCELLED:{ icon: Calendar,    color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  APPOINTMENT_REMINDER: { icon: Calendar,    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  PAYMENT_RECEIVED:     { icon: CreditCard,  color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  PAYMENT_SUCCESS:      { icon: CreditCard,  color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  SUBSCRIPTION_ACTIVE:  { icon: CheckCircle, color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  SUBSCRIPTION_EXPIRING:{ icon: AlertCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  SERVICE_COMPLETED:    { icon: Scissors,    color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  GENERAL:              { icon: Bell,        color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  INFO:                 { icon: Bell,        color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  PROMO:                { icon: Bell,        color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  SYSTEM:               { icon: AlertCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

function timeAgo(iso: string) {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000;
  if (secs < 60) return "Ahora";
  if (secs < 3600) return `Hace ${Math.floor(secs / 60)} min`;
  if (secs < 86400) return `Hace ${Math.floor(secs / 3600)}h`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications?limit=50").then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.notifications ?? d?.data ?? []);
    }),
    retry: false,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const notifications: any[] = Array.isArray(data) ? data : [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-text-tertiary text-sm mt-0.5">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
          >
            Leer todas
          </button>
        )}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3">
          <Bell size={44} className="text-text-tertiary" />
          <p className="text-text-secondary">Sin notificaciones</p>
          <p className="text-text-tertiary text-xs">Aquí aparecerán tus alertas y novedades</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.GENERAL;
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => { if (!n.isRead) readMutation.mutate(n.id); }}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all",
                  n.isRead
                    ? "bg-transparent border-[rgba(255,255,255,0.04)]"
                    : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.15)]"
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className={cn("text-sm font-semibold truncate", n.isRead ? "text-text-secondary" : "text-white")}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className={cn("text-xs leading-relaxed", n.isRead ? "text-text-tertiary" : "text-text-secondary")}>
                    {n.body}
                  </p>
                  <p className="text-text-tertiary text-xs mt-1">
                    {timeAgo(n.createdAt ?? n.sentAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
