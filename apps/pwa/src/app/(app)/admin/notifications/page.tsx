"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronLeft,
  CheckCircle,
  Send,
  List,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface NotifItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sentAt?: string;
}

const TYPE_LABELS: Record<string, string> = {
  INFO: "Info",
  PROMO: "Promo",
  SYSTEM: "Sistema",
  GENERAL: "General",
};

const EMPTY_FORM = { title: "", body: "", type: "INFO" };

export default function AdminNotificationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"history" | "send">("history");
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications-history"],
    queryFn: () =>
      api.get("/notifications?limit=50").then((r) => {
        const d = r.data;
        return Array.isArray(d) ? d : (d?.notifications ?? d?.data ?? []);
      }),
    retry: false,
  });

  const notifications: NotifItem[] = Array.isArray(data) ? data : [];

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/notifications/send", {
        title: form.title,
        body: form.body,
        type: form.type,
      }),
    onSuccess: () => {
      setSent(true);
      setSendError("");
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["admin-notifications-history"] });
      setTimeout(() => setSent(false), 4000);
    },
    onError: (e: any) => {
      // Fallback to /notifications/send-all
      api.post("/notifications/send-all", { title: form.title, body: form.body, type: form.type })
        .then(() => {
          setSent(true);
          setSendError("");
          setForm(EMPTY_FORM);
          qc.invalidateQueries({ queryKey: ["admin-notifications-history"] });
          setTimeout(() => setSent(false), 4000);
        })
        .catch(() => {
          setSendError(e?.response?.data?.message ?? "No se pudo enviar la notificación");
        });
    },
  });

  function handleSend() {
    if (!form.title.trim() || !form.body.trim()) {
      setSendError("Completa el título y el mensaje");
      return;
    }
    setSendError("");
    sendMutation.mutate();
  }

  function timeAgo(iso: string) {
    const secs = (Date.now() - new Date(iso).getTime()) / 1000;
    if (secs < 60) return "Ahora";
    if (secs < 3600) return `Hace ${Math.floor(secs / 60)} min`;
    if (secs < 86400) return `Hace ${Math.floor(secs / 3600)}h`;
    return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Notificaciones</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors",
            tab === "history"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-white/5 border-white/10 text-text-secondary hover:text-white"
          )}
        >
          <List size={15} />
          Historial
        </button>
        <button
          onClick={() => setTab("send")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-colors",
            tab === "send"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-white/5 border-white/10 text-text-secondary hover:text-white"
          )}
        >
          <Send size={15} />
          Enviar masivo
        </button>
      </div>

      {tab === "history" ? (
        isLoading ? (
          <PageSpinner />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-3">
            <Bell size={40} className="text-text-tertiary" />
            <p className="text-text-secondary text-sm">Sin historial de notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm font-semibold">{n.title}</p>
                      <span className="text-text-tertiary text-xs shrink-0">
                        {timeAgo(n.createdAt ?? n.sentAt ?? "")}
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5">{n.body}</p>
                    {n.type && (
                      <span className="text-text-tertiary text-xs mt-1 inline-block">
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-1">Enviar a todos los usuarios</h2>
          <p className="text-text-tertiary text-xs mb-4">
            Se enviará a todos los usuarios con token activo
          </p>

          {sent && (
            <div className="mb-4 bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={15} className="text-success" />
              <p className="text-success text-sm">Notificación enviada exitosamente</p>
            </div>
          )}

          {sendError && (
            <div className="mb-4 bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle size={15} className="text-error" />
              <p className="text-error text-sm">{sendError}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Título *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título de la notificación"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Mensaje *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Contenido del mensaje..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Tipo</label>
              <div className="flex gap-2">
                {[{ v: "INFO", l: "Info" }, { v: "PROMO", l: "Promo" }, { v: "SYSTEM", l: "Sistema" }].map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setForm((f) => ({ ...f, type: t.v }))}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                      form.type === t.v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 text-text-secondary hover:border-white/20"
                    )}
                  >
                    {t.l}
                  </button>
                ))}
              </div>
            </div>

            <Button
              fullWidth
              loading={sendMutation.isPending}
              onClick={handleSend}
              className="gap-2 mt-2"
            >
              <Send size={16} />
              Enviar a todos
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
