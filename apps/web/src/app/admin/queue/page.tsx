"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Wifi, WifiOff } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; label: string }> = {
  WAITING:    { bg: "#eab30820", border: "#eab30840", text: "#fbbf24",  label: "Esperando" },
  CALLED:     { bg: "#3b82f620", border: "#3b82f640", text: "#60a5fa",  label: "Llamado" },
  IN_SERVICE: { bg: "#22c55e20", border: "#22c55e40", text: "#4ade80",  label: "En servicio" },
  COMPLETED:  { bg: "#ffffff08", border: "#ffffff15", text: "#ffffff30", label: "Completado" },
  ABANDONED:  { bg: "#ef444420", border: "#ef444440", text: "#f87171",  label: "Abandonó" },
};

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function waitMin(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 60000);
}

export default function AdminQueuePage() {
  const [selectedBarbershop, setSelectedBarbershop] = useState("");
  const [connected, setConnected] = useState(false);

  const { data: barbershopsData } = useQuery({
    queryKey: ["admin-barbershops-queue"],
    queryFn: () => adminApi.getAdminBarbershops(),
    retry: false,
  });

  const { data: queueData, refetch } = useQuery({
    queryKey: ["admin-queue", selectedBarbershop],
    queryFn: () => adminApi.getQueue(selectedBarbershop),
    enabled: !!selectedBarbershop,
    refetchInterval: 10000,
  });

  // Socket.io para tiempo real
  useEffect(() => {
    if (!selectedBarbershop) return;
    let socket: any = null;

    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
        socket = io(apiUrl, { transports: ["websocket"], path: "/socket.io" });
        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));
        socket.on("queue:updated", () => refetch());
        socket.emit("queue:join", { barbershopId: selectedBarbershop });
      } catch { /* socket.io no disponible */ }
    };

    connectSocket();
    return () => { if (socket) socket.disconnect(); setConnected(false); };
  }, [selectedBarbershop, refetch]);

  const barbershops: any[] = barbershopsData?.data ?? barbershopsData ?? [];
  const entries: any[] = queueData?.entries ?? [];
  const stats = queueData?.stats ?? {};

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cola virtual</h1>
          <p className="text-white/40 text-sm mt-1">Monitoreo en tiempo real</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${connected ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/30"}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? "En vivo" : "Sin conexión"}
        </div>
      </div>

      {/* Selector de barbería */}
      <div className="mb-6">
        <label className="text-white/50 text-xs font-semibold mb-2 block uppercase tracking-widest">Seleccionar barbería</label>
        <div className="flex gap-2 flex-wrap">
          {barbershops.map((b: any) => (
            <button key={b.id} onClick={() => setSelectedBarbershop(b.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selectedBarbershop === b.id ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              }`}>
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedBarbershop ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
          <p className="text-white/20 text-4xl mb-4">👥</p>
          <p className="text-white/40">Selecciona una barbería para ver su cola</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "En espera", value: stats.totalWaiting ?? entries.filter((e: any) => e.status === "WAITING").length, color: "#fbbf24" },
              { label: "En servicio", value: entries.filter((e: any) => e.status === "IN_SERVICE").length, color: "#4ade80" },
              { label: "Llamados", value: entries.filter((e: any) => e.status === "CALLED").length, color: "#60a5fa" },
              { label: "Completados", value: entries.filter((e: any) => e.status === "COMPLETED").length, color: "#ffffff40" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-white/40 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Lista */}
          {entries.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-white/30">Cola vacía — No hay clientes en este momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((e: any) => {
                const s = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.WAITING;
                return (
                  <div key={e.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-sm flex-shrink-0">
                      #{e.position}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#c9a227]/15 flex items-center justify-center text-[#c9a227] font-bold text-sm flex-shrink-0">
                      {e.user?.firstName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{e.user?.firstName} {e.user?.lastName}</p>
                      <p className="text-white/30 text-xs">~ {e.estimatedWaitMinutes ?? waitMin(e.joinedAt)} min espera · Entró {fmtTime(e.joinedAt)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0"
                      style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
