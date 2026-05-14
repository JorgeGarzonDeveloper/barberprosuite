"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, FileSpreadsheet } from "lucide-react";
import { exportRefundsExcel } from "@/lib/excel-export";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#f59e0b",
  IN_PROGRESS: "#60a5fa",
  RESOLVED: "#4ade80",
  CLOSED: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En revisión",
  RESOLVED: "Aprobada",
  CLOSED: "Rechazada",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function RefundsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-refunds", statusFilter],
    queryFn: () => adminApi.getRefunds(1, statusFilter),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      adminApi.processRefund(id, action, adminNote || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-refunds"] });
      setExpanded(null);
      setAdminNote("");
      setProcessing(null);
    },
    onError: () => setProcessing(null),
  });

  const tickets: any[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const FILTERS = [
    { label: "Todas", value: "" },
    { label: "Abiertas", value: "OPEN" },
    { label: "En revisión", value: "IN_PROGRESS" },
    { label: "Aprobadas", value: "RESOLVED" },
    { label: "Rechazadas", value: "CLOSED" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Devoluciones</h1>
          <p className="text-white/40 text-sm mt-1">{total} solicitud{total !== 1 ? "es" : ""} encontrada{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => tickets.length && exportRefundsExcel(tickets)}
          disabled={!tickets.length}
          className="flex items-center gap-2 px-4 py-2 bg-[#c9a227]/15 border border-[#c9a227]/30 text-[#c9a227] rounded-xl text-sm font-semibold hover:bg-[#c9a227]/25 transition-all disabled:opacity-40 self-start sm:self-auto"
        >
          <FileSpreadsheet size={15} />
          Exportar Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              statusFilter === f.value
                ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <CheckCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">Sin solicitudes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const isOpen = expanded === t.id;
            const canProcess = t.status === "OPEN" || t.status === "IN_PROGRESS";
            return (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : t.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-semibold text-sm">
                        {t.user?.firstName} {t.user?.lastName}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${STATUS_COLORS[t.status]}20`,
                          color: STATUS_COLORS[t.status],
                        }}
                      >
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs truncate">{t.subject}</p>
                    <p className="text-white/30 text-xs mt-0.5">{fmt(t.createdAt)} · {t.user?.email}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                    {/* Message */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/40 text-xs font-bold uppercase mb-2">Mensaje</p>
                      <pre className="text-white/70 text-sm whitespace-pre-wrap font-sans leading-relaxed">{t.subject}</pre>
                    </div>

                    {/* Attachment */}
                    {t.attachmentUrl && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/40 text-xs font-bold uppercase mb-3">Comprobante de pago</p>
                        <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" className="group block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.attachmentUrl}
                            alt="Comprobante"
                            className="max-h-64 rounded-lg object-contain bg-white/5 group-hover:opacity-90 transition-opacity"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                          <div className="flex items-center gap-1 text-[#c9a227] text-xs mt-2">
                            <ExternalLink size={12} /> Ver en tamaño completo
                          </div>
                        </a>
                      </div>
                    )}

                    {/* Replies */}
                    {t.replies?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-white/40 text-xs font-bold uppercase">Historial</p>
                        {t.replies.map((r: any) => (
                          <div
                            key={r.id}
                            className={`rounded-xl p-3 text-sm ${r.isAdmin ? "bg-[#c9a227]/10 border border-[#c9a227]/20 ml-8" : "bg-white/5 mr-8"}`}
                          >
                            <p className="text-white/70 text-xs font-bold mb-1">{r.isAdmin ? "Admin" : "Usuario"} · {fmt(r.createdAt)}</p>
                            <p className="text-white/80">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {canProcess && (
                      <div className="bg-white/5 rounded-xl p-4 space-y-3">
                        <p className="text-white/40 text-xs font-bold uppercase">Nota al cliente (opcional)</p>
                        <textarea
                          rows={2}
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Escribe una nota para incluir en la respuesta al cliente..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#c9a227]/30"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              if (!confirm("¿Rechazar esta solicitud de devolución?")) return;
                              setProcessing(t.id);
                              mutation.mutate({ id: t.id, action: "reject" });
                            }}
                            disabled={mutation.isPending && processing === t.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Rechazar
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm("¿Aprobar esta devolución? Se notificará al cliente.")) return;
                              setProcessing(t.id);
                              mutation.mutate({ id: t.id, action: "approve" });
                            }}
                            disabled={mutation.isPending && processing === t.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            {mutation.isPending && processing === t.id ? "Procesando..." : "Aprobar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
