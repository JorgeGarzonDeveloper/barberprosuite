"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { Activity, ChevronLeft, Users, Clock, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QueueEntry {
  id: string;
  position: number;
  status: string;
  estimatedWaitMinutes: number;
  user: { firstName: string; lastName: string };
  joinedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  WAITING:    { label: "Esperando",   color: "#fbbf24", bg: "rgba(234,179,8,0.15)"   },
  CALLED:     { label: "Llamado",     color: "#60a5fa", bg: "rgba(59,130,246,0.15)"  },
  IN_SERVICE: { label: "En servicio", color: "#4ade80", bg: "rgba(34,197,94,0.15)"   },
  COMPLETED:  { label: "Completado",  color: "#ffffff30", bg: "rgba(255,255,255,0.05)" },
  ABANDONED:  { label: "Abandonó",   color: "#f87171", bg: "rgba(239,68,68,0.15)"   },
};

export default function AdminQueuePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");

  const { data: barbershops } = useQuery({
    queryKey: ["admin-barbershops-simple"],
    queryFn: () =>
      api.get("/barbershops", { params: { limit: 100 } }).then((r) => {
        const d = r.data;
        return (d?.data?.data ?? d?.data ?? d ?? []) as Array<{ id: string; name: string }>;
      }),
  });

  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ["admin-queue-live", selectedId],
    queryFn: () =>
      api.get(`/queue/${selectedId}`).then((r) => r.data?.data ?? r.data),
    enabled: !!selectedId,
    refetchInterval: 15_000,
  });

  const entries: QueueEntry[] = queueData?.entries ?? [];

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Cola virtual</h1>
        <div className="flex items-center gap-1.5">
          {selectedId ? (
            <><Wifi size={14} className="text-success" /><span className="text-success text-xs font-semibold">En vivo</span></>
          ) : (
            <><WifiOff size={14} className="text-text-tertiary" /><span className="text-text-tertiary text-xs">Sin selección</span></>
          )}
        </div>
      </div>

      {/* Barbershop selector */}
      <div className="mb-4">
        <p className="text-text-tertiary text-xs font-semibold mb-2 uppercase tracking-wide">Selecciona una barbería</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(barbershops ?? []).map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors",
                selectedId === b.id
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-white/5 border-white/10 text-text-secondary hover:text-white"
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedId ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-3">
          <Activity size={44} className="text-text-tertiary" />
          <p className="text-text-secondary text-sm">Selecciona una barbería para ver su cola</p>
        </div>
      ) : isLoading ? (
        <PageSpinner />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="flex flex-col items-center gap-1 py-3">
              <Users size={18} className="text-warning" />
              <p className="text-xl font-bold text-white">{queueData?.totalWaiting ?? 0}</p>
              <p className="text-text-tertiary text-xs">En espera</p>
            </Card>
            <Card className="flex flex-col items-center gap-1 py-3">
              <Clock size={18} className="text-primary" />
              <p className="text-xl font-bold text-white">{queueData?.averageWaitTime ?? 0}<span className="text-xs font-normal text-text-tertiary"> min</span></p>
              <p className="text-text-tertiary text-xs">Espera prom.</p>
            </Card>
            <Card className="flex flex-col items-center gap-1 py-3">
              <Activity size={18} className={queueData?.isOpen ? "text-success" : "text-error"} />
              <p className={cn("text-sm font-bold", queueData?.isOpen ? "text-success" : "text-error")}>
                {queueData?.isOpen ? "Abierta" : "Cerrada"}
              </p>
              <p className="text-text-tertiary text-xs">Estado</p>
            </Card>
          </div>

          <p className="text-text-tertiary text-xs mb-3">Actualiza cada 15 s · {entries.length} en cola</p>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-8 gap-2">
              <Users size={36} className="text-text-tertiary" />
              <p className="text-text-secondary text-sm">La cola está vacía</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((e) => {
                const s = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.WAITING;
                return (
                  <Card key={e.id} padding="sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">#{e.position}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">
                          {e.user?.firstName} {e.user?.lastName}
                        </p>
                        <p className="text-text-tertiary text-xs">
                          Unido: {new Date(e.joinedAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-text-tertiary text-xs">~{e.estimatedWaitMinutes} min</span>
                        <span
                          className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
