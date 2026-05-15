"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:     { bg: "#eab30820", text: "#fbbf24", label: "Pendiente" },
  CONFIRMED:   { bg: "#3b82f620", text: "#60a5fa", label: "Confirmada" },
  IN_PROGRESS: { bg: "#a855f720", text: "#c084fc", label: "En curso" },
  COMPLETED:   { bg: "#22c55e20", text: "#4ade80", label: "Completada" },
  CANCELLED:   { bg: "#ef444420", text: "#f87171", label: "Cancelada" },
  NO_SHOW:     { bg: "#ffffff10", text: "#ffffff40", label: "No asistió" },
};

const FILTERS = [
  { label: "Todas", value: "" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Confirmada", value: "CONFIRMED" },
  { label: "En curso", value: "IN_PROGRESS" },
  { label: "Completada", value: "COMPLETED" },
  { label: "Cancelada", value: "CANCELLED" },
  { label: "No asistió", value: "NO_SHOW" },
];

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAppointmentsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments", page, status],
    queryFn: () => adminApi.getAppointments(page, status),
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });

  const appointments: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 15));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Citas</h1>
        <p className="text-white/40 text-sm mt-1">{total} citas en total</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              status === f.value ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/30">Sin citas</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {appointments.map((a) => {
              const s = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING;
              return (
                <div key={a.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{a.client?.firstName} {a.client?.lastName}</p>
                      <p className="text-white/40 text-xs">{a.client?.email}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="border-t border-white/8 pt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <span>✂</span>
                      <span>{a.barbershop?.name} · {a.barber?.firstName} {a.barber?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <span>📅</span>
                      <span>{fmtDate(a.scheduledAt)} {fmtTime(a.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <span>💰</span>
                      <span>{a.service?.name} · {a.service?.duration} min · {fmtCOP(a.service?.price ?? 0)}</span>
                    </div>
                  </div>
                  {["PENDING", "CONFIRMED"].includes(a.status) && (
                    <div className="mt-3 pt-3 border-t border-white/8">
                      <button
                        onClick={() => {
                          if (confirm(`¿Cancelar la cita de ${a.client?.firstName} ${a.client?.lastName}?`)) {
                            cancelMutation.mutate(a.id);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} /> Cancelar cita
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-sm">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Siguiente →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
