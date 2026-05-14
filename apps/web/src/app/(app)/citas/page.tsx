"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth.store";
import { Calendar, Scissors, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from "lucide-react";

const STATUS = {
  PENDING: { label: "Pendiente", color: "#f59e0b", bg: "#f59e0b15", icon: Clock },
  CONFIRMED: { label: "Confirmada", color: "#60a5fa", bg: "#60a5fa15", icon: CheckCircle },
  IN_SERVICE: { label: "En servicio", color: "#c9a227", bg: "#c9a22715", icon: Scissors },
  COMPLETED: { label: "Completada", color: "#4ade80", bg: "#4ade8015", icon: CheckCircle },
  CANCELLED: { label: "Cancelada", color: "#f87171", bg: "#f8717115", icon: XCircle },
  NO_SHOW: { label: "No asistió", color: "#6b7280", bg: "#6b728015", icon: AlertCircle },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "short", year: "2-digit" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function CitasPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("UPCOMING");

  const { data, isLoading } = useQuery({
    queryKey: ["my-appointments", filter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "30" });
      if (filter === "UPCOMING") params.set("status", "CONFIRMED");
      else if (filter !== "ALL") params.set("status", filter);
      return api.get(`/appointments/my?${params}`).then((r) => r.data.data?.appointments ?? []);
    },
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/appointments/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
  });

  const appointments: any[] = Array.isArray(data) ? data : [];

  const FILTERS = [
    { v: "UPCOMING", label: "Próximas" },
    { v: "ALL", label: "Todas" },
    { v: "COMPLETED", label: "Completadas" },
    { v: "CANCELLED", label: "Canceladas" },
  ];

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:pt-10">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-white">Mis citas</h1>
        {user?.role !== "BARBER" && (
          <Link href="/mapa" className="bg-[#c9a227] text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#e8cc6a] transition-colors">
            + Reservar
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {FILTERS.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${filter === f.v ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Calendar className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 font-medium mb-1">Sin citas</p>
          {user?.role !== "BARBER" && (
            <Link href="/mapa" className="text-[#c9a227] text-sm hover:underline">Reservar una cita →</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const st = STATUS[a.status as keyof typeof STATUS] ?? STATUS.PENDING;
            const canCancel = ["PENDING", "CONFIRMED"].includes(a.status);
            const apptDate = new Date(a.scheduledAt);
            const twoHrsFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const cancelAllowed = canCancel && apptDate > twoHrsFromNow;

            return (
              <div key={a.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Scissors size={16} className="text-[#c9a227] flex-shrink-0" />
                    <p className="text-white font-bold text-sm">{a.service?.name ?? "Servicio"}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color: st.color, backgroundColor: st.bg }}>
                    {st.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 mb-3 text-xs text-white/50">
                  <div className="flex items-center gap-1"><Calendar size={10} />{fmtDate(a.scheduledAt)}</div>
                  <div className="flex items-center gap-1"><Clock size={10} />{fmtTime(a.scheduledAt)}</div>
                  <div className="flex items-center gap-1"><Scissors size={10} />
                    {a.barber?.user ? `${a.barber.user.firstName} ${a.barber.user.lastName}` : "Barbero"}
                  </div>
                  <div className="text-[#c9a227] font-semibold">{fmtCOP(a.totalPrice ?? 0)}</div>
                </div>

                <p className="text-white/30 text-xs mb-3">{a.barbershop?.name ?? "Barbería"}</p>

                {cancelAllowed && (
                  <button
                    onClick={() => {
                      if (!confirm("¿Cancelar esta cita? Solo se puede con +2h de anticipación.")) return;
                      cancelMutation.mutate(a.id);
                    }}
                    disabled={cancelMutation.isPending}
                    className="w-full py-2 border border-red-500/30 bg-red-500/10 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    Cancelar cita
                  </button>
                )}

                {!cancelAllowed && canCancel && (
                  <p className="text-white/30 text-xs text-center">No se puede cancelar con menos de 2h de anticipación</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
