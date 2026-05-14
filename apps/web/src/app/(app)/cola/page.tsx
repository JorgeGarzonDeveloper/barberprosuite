"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Clock, Users, MapPin, Scissors } from "lucide-react";

export default function ColaPage() {
  const router = useRouter();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["queue-my-entry"],
    queryFn: () => api.get("/queue/my-entry").then((r) => r.data.data ?? r.data).catch(() => null),
    refetchInterval: 15_000,
    retry: false,
  });

  const { data: barbershops } = useQuery({
    queryKey: ["barbershops-list"],
    queryFn: () => api.get("/barbershops?limit=20").then((r) => r.data.data?.barbershops ?? r.data.data ?? []).catch(() => []),
    retry: false,
  });

  const isInQueue = entry && (entry.status === "WAITING" || entry.status === "IN_SERVICE" || entry.status === "CALLED");

  if (isLoading) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="h-8 bg-white/5 rounded w-1/3 mb-6 animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto lg:pt-10">
      <h1 className="text-2xl font-bold text-white mb-6">Cola virtual</h1>

      {isInQueue ? (
        <div>
          <div className={`rounded-2xl border p-6 mb-6 ${entry.status === "IN_SERVICE" || entry.status === "CALLED" ? "bg-green-500/10 border-green-500/30" : "bg-[#c9a227]/10 border-[#c9a227]/30"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${entry.status === "IN_SERVICE" || entry.status === "CALLED" ? "bg-green-500" : "bg-[#c9a227]"}`} />
              <span className={`text-sm font-bold ${entry.status === "IN_SERVICE" || entry.status === "CALLED" ? "text-green-400" : "text-[#c9a227]"}`}>
                {entry.status === "IN_SERVICE" || entry.status === "CALLED" ? "¡Es tu turno!" : "En espera"}
              </span>
            </div>

            {entry.barbershopName && (
              <p className="text-white font-bold text-lg mb-1">{entry.barbershopName}</p>
            )}
            {entry.barberName && (
              <p className="text-white/50 text-sm mb-4 flex items-center gap-1">
                <Scissors size={12} /> {entry.barberName}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <p className="text-white text-2xl font-black">{entry.position ?? "—"}</p>
                <p className="text-white/40 text-xs mt-0.5">Posición</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <p className="text-white text-2xl font-black">
                  {entry.estimatedWaitMinutes > 0 ? `~${entry.estimatedWaitMinutes}` : "—"}
                </p>
                <p className="text-white/40 text-xs mt-0.5">min espera</p>
              </div>
            </div>

            {entry.status === "IN_SERVICE" || entry.status === "CALLED" ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-300 text-sm text-center">
                El barbero te está esperando. Acércate a la silla.
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-white/40 text-xs text-center">
                Mantente a menos de 500 m de la barbería para no perder tu turno.
              </div>
            )}

            <Link href={`/cola/${entry.id}`}
              className="mt-4 flex items-center justify-center gap-2 w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl transition-colors">
              Ver detalle de mi turno
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center mb-6">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No estás en ninguna fila</p>
            <p className="text-white/40 text-sm">Ve a una barbería y únete a la cola virtual escaneando su QR, o visita la barbería desde el mapa.</p>
          </div>

          <h2 className="text-white font-bold mb-3">Barberías disponibles</h2>
          <div className="space-y-2">
            {(barbershops ?? []).map((shop: any) => (
              <Link key={shop.id} href={`/barberia/${shop.id}`}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#c9a227]/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#c9a227]/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {shop.coverImageUrl
                    ? <img src={shop.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    : <Scissors size={20} className="text-[#c9a227]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{shop.name}</p>
                  {shop.address && (
                    <p className="text-white/40 text-xs mt-0.5 flex items-center gap-1 truncate">
                      <MapPin size={10} />{shop.address}
                    </p>
                  )}
                </div>
                <div className="text-white/20 text-xs flex items-center gap-1">
                  <Users size={12} />
                  {shop.queueLength ?? 0}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
