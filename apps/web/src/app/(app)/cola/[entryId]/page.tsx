"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Clock, Scissors, MapPin, Bell, LogOut, Lock } from "lucide-react";

export default function QueueEntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [leaving, setLeaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: entry, isLoading } = useQuery({
    queryKey: ["queue-entry", entryId],
    queryFn: () => api.get("/queue/my-entry").then((r) => r.data.data ?? r.data),
    refetchInterval: 15_000,
    retry: false,
  });

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await api.post(`/queue/${entryId}/leave`);
      qc.invalidateQueries({ queryKey: ["queue-my-entry"] });
      router.replace("/cola");
    } catch {
      setLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto text-center">
        <p className="text-white/40">No estás en ninguna fila.</p>
        <button onClick={() => router.push("/cola")} className="mt-4 text-[#c9a227] hover:underline text-sm">
          Volver a cola
        </button>
      </div>
    );
  }

  const isReady = entry.status === "IN_SERVICE" || entry.status === "CALLED";
  const position = entry.position ?? 0;
  const estimatedWait = entry.estimatedWaitMinutes ?? 0;

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto lg:pt-10">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-white">{entry.barbershopName ?? "Barbería"}</h1>
        <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full border ${isReady ? "bg-green-500/10 border-green-500/30" : "bg-[#c9a227]/10 border-[#c9a227]/30"}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isReady ? "bg-green-500" : "bg-[#c9a227]"}`} />
          <span className={`text-sm font-bold ${isReady ? "text-green-400" : "text-[#c9a227]"}`}>
            {isReady ? "¡Es tu turno!" : "En espera"}
          </span>
        </div>
      </div>

      {/* Position circle */}
      <div className="flex justify-center mb-6">
        <div className={`w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl ${isReady ? "border-green-500/40 bg-green-500 shadow-green-500/30" : "border-[#c9a227]/40 bg-[#c9a227] shadow-[#c9a227]/30"}`}>
          {isReady ? (
            <>
              <Bell className="text-white" size={40} />
              <p className="text-white font-black text-xl mt-2">¡Ahora!</p>
            </>
          ) : (
            <>
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Posición</p>
              <p className="text-white font-black text-6xl leading-none">{position}</p>
            </>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="w-10 h-10 rounded-xl bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
            <Clock size={20} className="text-[#c9a227]" />
          </div>
          <div>
            <p className="text-white/40 text-xs">Tiempo estimado</p>
            <p className="text-white font-bold">{estimatedWait > 0 ? `~${estimatedWait} min` : "Calculando..."}</p>
          </div>
        </div>

        {entry.barberName && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="w-10 h-10 rounded-xl bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
              <Scissors size={20} className="text-[#c9a227]" />
            </div>
            <div>
              <p className="text-white/40 text-xs">Tu barbero</p>
              <p className="text-white font-bold">{entry.barberName}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="w-10 h-10 rounded-xl bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
            <MapPin size={20} className="text-[#c9a227]" />
          </div>
          <div className="flex-1">
            <p className="text-white/40 text-xs">Rastreo activo</p>
            <p className="text-white font-bold">Radio 500 m</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Alert / hint */}
      {isReady ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <div className="text-2xl">🚶</div>
          <div>
            <p className="text-green-400 font-bold text-sm">¡Acércate a la silla!</p>
            <p className="text-white/60 text-xs mt-1">El barbero te está esperando. Tienes 5 minutos para presentarte.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/5 rounded-xl p-3 mb-6 flex gap-2">
          <p className="text-white/30 text-xs">Mantente a menos de 500 m de la barbería para no perder tu turno.</p>
        </div>
      )}

      {/* Leave button or lock */}
      {isReady ? (
        <div className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-white/30 text-sm">
          <Lock size={14} />
          No puedes abandonar mientras estás siendo atendido
        </div>
      ) : (
        <button onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold text-sm hover:bg-red-500/20 transition-all">
          <LogOut size={16} /> Abandonar fila
        </button>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">¿Abandonar la fila?</h3>
            <p className="text-white/50 text-sm mb-6">Perderás tu posición #{position} y tendrás que volver a unirte para entrar de nuevo.</p>
            <button onClick={handleLeave} disabled={leaving}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl mb-3 disabled:opacity-50 transition-colors">
              {leaving ? "Saliendo..." : "Sí, salir"}
            </button>
            <button onClick={() => setShowConfirm(false)} disabled={leaving}
              className="w-full text-white/40 py-2 text-sm hover:text-white transition-colors">
              Quedarme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
