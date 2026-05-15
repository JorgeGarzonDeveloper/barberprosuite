"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Bell, Send, Check } from "lucide-react";

const EMPTY_FORM = { title: "", body: "", type: "INFO" };
const TYPES = [
  { value: "INFO", label: "Información" },
  { value: "PROMO", label: "Promoción" },
  { value: "SYSTEM", label: "Sistema" },
];

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  return `Hace ${Math.floor(hrs / 24)}d`;
}

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"list" | "send">("list");
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => adminApi.getNotifications(),
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => adminApi.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: typeof EMPTY_FORM) => adminApi.sendNotificationAll(payload),
    onSuccess: () => {
      setSent(true); setForm(EMPTY_FORM); setConfirm(false);
      setTimeout(() => setSent(false), 3000);
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const notifications: any[] = data?.notifications ?? data?.data?.data ?? data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
        <p className="text-white/40 text-sm mt-1">Historial y envío masivo</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: "list", label: "Historial" }, { key: "send", label: "Enviar masivo" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              tab === t.key ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        isLoading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Bell size={36} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30">Sin notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <button key={n.id} onClick={() => !n.isRead && markRead.mutate(n.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all hover:bg-white/10 ${
                  n.isRead ? "bg-transparent border-white/5" : "bg-white/5 border-white/10"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.isRead ? "bg-white/5" : "bg-[#c9a227]/15"}`}>
                  <Bell size={18} className={n.isRead ? "text-white/20" : "text-[#c9a227]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm font-semibold truncate ${n.isRead ? "text-white/50" : "text-white"}`}>{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#c9a227] flex-shrink-0" />}
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed line-clamp-2">{n.body}</p>
                  <p className="text-white/20 text-xs mt-1">{timeAgo(n.createdAt ?? n.sentAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="max-w-lg">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            {sent && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Check size={16} className="text-green-400" />
                <p className="text-green-400 text-sm font-semibold">Notificación enviada a todos los usuarios</p>
              </div>
            )}

            <div className="mb-4">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Nueva actualización disponible"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40" />
            </div>

            <div className="mb-4">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Mensaje *</label>
              <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Escribe el mensaje que recibirán todos los usuarios..."
                rows={4}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40 resize-none" />
            </div>

            <div className="mb-6">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Tipo</label>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button key={t.value} onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      form.type === t.value ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {!confirm ? (
              <button
                onClick={() => {
                  if (!form.title || !form.body) { alert("Completa el título y el mensaje."); return; }
                  setConfirm(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm transition-all"
              >
                <Send size={16} /> Enviar a todos los usuarios
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-amber-400 text-sm font-semibold">¿Enviar "{form.title}" a TODOS los usuarios?</p>
                  <p className="text-amber-400/60 text-xs mt-0.5">Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setConfirm(false)} className="flex-1 py-3 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl text-sm">
                    Cancelar
                  </button>
                  <button onClick={() => sendMutation.mutate(form)} disabled={sendMutation.isPending}
                    className="flex-1 py-3 bg-[#c9a227] text-[#0a0a0f] font-bold rounded-xl text-sm disabled:opacity-50">
                    {sendMutation.isPending ? "Enviando..." : "Confirmar envío"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
