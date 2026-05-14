"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth.store";
import { Megaphone, CheckCircle, Users, Scissors } from "lucide-react";

interface QueueEntry {
  id: string;
  position: number;
  estimatedWaitMinutes: number;
  status: "WAITING" | "IN_SERVICE" | "CALLED";
  joinedAt: string;
  clientName?: string;
  clientAvatarUrl?: string;
}

interface BarberQueueData {
  barbershopName: string;
  totalWaiting: number;
  inService: QueueEntry | null;
  queue: QueueEntry[];
}

export default function BarberColaPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery<BarberQueueData>({
    queryKey: ["barber-queue"],
    queryFn: () => api.get("/queue/my-queue").then((r) => r.data.data ?? r.data),
    enabled: user?.role === "BARBER" || user?.role === "ADMIN",
    refetchInterval: 20_000,
    retry: false,
  });

  const callNextMutation = useMutation({
    mutationFn: () => api.post("/queue/call-next-mine"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barber-queue"] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post("/queue/complete-current"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barber-queue"] }),
  });

  if (user?.role !== "BARBER" && user?.role !== "ADMIN") {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto text-center">
        <Scissors className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/40">Sección exclusiva para barberos.</p>
      </div>
    );
  }

  const inService = data?.inService;
  const queue = (data?.queue ?? []).filter((e) => e.status === "WAITING");

  return (
    <div className="px-4 pt-6 pb-8 max-w-2xl mx-auto lg:pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Cola</h1>
          <p className="text-white/40 text-sm mt-0.5">{data?.barbershopName ?? "Cargando..."}</p>
        </div>
        <div className="bg-[#c9a227]/15 border border-[#c9a227]/30 rounded-xl px-4 py-2 text-center">
          <p className="text-[#c9a227] text-xl font-black">{data?.totalWaiting ?? 0}</p>
          <p className="text-[#c9a227]/70 text-xs font-semibold">esperando</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {/* In service card or call next */}
          {inService ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 font-bold text-sm">En atención</span>
                </div>
                <span className="text-white/30 text-xs">
                  {new Date(inService.joinedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#c9a227]/20 flex items-center justify-center flex-shrink-0">
                  {inService.clientAvatarUrl
                    ? <img src={inService.clientAvatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                    : <span className="text-[#c9a227] font-bold">{inService.clientName?.[0] ?? "C"}</span>}
                </div>
                <p className="text-white font-bold text-lg">{inService.clientName ?? "Cliente"}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Terminaste con ${inService.clientName ?? "este cliente"}?`)) {
                    completeMutation.mutate();
                  }
                }}
                disabled={completeMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">
                <CheckCircle size={18} />
                {completeMutation.isPending ? "Procesando..." : "Completar turno"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => callNextMutation.mutate()}
              disabled={callNextMutation.isPending || queue.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-4 rounded-xl disabled:opacity-40 transition-all text-base">
              <Megaphone size={20} />
              {callNextMutation.isPending ? "Llamando..." : queue.length === 0 ? "Sin clientes en espera" : "Llamar siguiente"}
            </button>
          )}

          {/* Queue list */}
          {queue.length > 0 && (
            <>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wide">En espera ({queue.length})</p>
              <div className="space-y-2">
                {queue.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-white/60 text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#c9a227]/15 flex items-center justify-center flex-shrink-0">
                      {entry.clientAvatarUrl
                        ? <img src={entry.clientAvatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-[#c9a227] font-bold text-sm">{entry.clientName?.[0] ?? "C"}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{entry.clientName ?? "Cliente"}</p>
                      <p className="text-white/40 text-xs">~{entry.estimatedWaitMinutes} min</p>
                    </div>
                    <p className="text-white/30 text-xs">
                      {new Date(entry.joinedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!inService && queue.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
              <p className="text-white font-semibold">Cola vacía</p>
              <p className="text-white/40 text-sm mt-1">No hay clientes esperando.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
