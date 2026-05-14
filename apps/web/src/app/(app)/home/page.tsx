"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import { MapPin, Clock, Calendar, ChevronRight, Scissors, Bell, Users } from "lucide-react";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function HomePage() {
  const { user } = useAuthStore();

  const { data: queueEntry } = useQuery({
    queryKey: ["my-queue-entry"],
    queryFn: () => api.get("/queue/my-entry").then((r) => r.data.data).catch(() => null),
    retry: false,
    refetchInterval: 15000,
  });

  const { data: upcomingAppts } = useQuery({
    queryKey: ["upcoming-appointments"],
    queryFn: () => api.get("/appointments/my?status=CONFIRMED&limit=3").then((r) => r.data.data?.appointments ?? []).catch(() => []),
    retry: false,
  });

  const { data: nearbyShops } = useQuery({
    queryKey: ["nearby-shops-home"],
    queryFn: () => api.get("/barbershops?limit=6&isActive=true").then((r) => r.data.data?.barbershops ?? []).catch(() => []),
    retry: false,
  });

  const { data: barberQueue } = useQuery({
    queryKey: ["barber-queue-home"],
    queryFn: () => api.get("/queue/my-barbershop").then((r) => r.data.data).catch(() => null),
    enabled: user?.role === "BARBER",
    retry: false,
    refetchInterval: 15000,
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:pt-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-white/40 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold text-white">{user?.firstName ?? "Usuario"} 👋</h1>
        <p className="text-white/30 text-xs mt-0.5 capitalize">{user?.role?.toLowerCase() === "barber" ? "Barbero" : "Cliente"}</p>
      </div>

      {/* Active queue card */}
      {queueEntry && (
        <Link href={`/cola/${queueEntry.id}`}
          className="block bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-2xl p-4 mb-4 hover:bg-[#c9a227]/15 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#c9a227]/20 flex items-center justify-center">
                <Clock size={20} className="text-[#c9a227]" />
              </div>
              <div>
                <p className="text-[#c9a227] font-bold text-sm">En cola · Posición #{queueEntry.position ?? "?"}</p>
                <p className="text-white/50 text-xs">{queueEntry.barbershop?.name ?? "Barbería"}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#c9a227]" />
          </div>
        </Link>
      )}

      {/* Barber queue summary */}
      {user?.role === "BARBER" && barberQueue && (
        <Link href="/barber/cola"
          className="block bg-[#60a5fa]/10 border border-[#60a5fa]/30 rounded-2xl p-4 mb-4 hover:bg-[#60a5fa]/15 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#60a5fa]/20 flex items-center justify-center">
                <Users size={20} className="text-[#60a5fa]" />
              </div>
              <div>
                <p className="text-[#60a5fa] font-bold text-sm">
                  {barberQueue.waitingCount ?? 0} cliente{barberQueue.waitingCount !== 1 ? "s" : ""} en espera
                </p>
                <p className="text-white/50 text-xs">Ver cola →</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#60a5fa]" />
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {user?.role !== "BARBER" && (
          <Link href="/mapa"
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-[#c9a227]/30 hover:bg-white/8 transition-all">
            <div className="w-10 h-10 bg-[#c9a227]/15 rounded-xl flex items-center justify-center">
              <MapPin size={20} className="text-[#c9a227]" />
            </div>
            <p className="text-white font-semibold text-sm">Buscar barbería</p>
            <p className="text-white/30 text-xs">Encuentra cerca de ti</p>
          </Link>
        )}
        <Link href="/citas"
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-[#a78bfa]/30 hover:bg-white/8 transition-all">
          <div className="w-10 h-10 bg-[#a78bfa]/15 rounded-xl flex items-center justify-center">
            <Calendar size={20} className="text-[#a78bfa]" />
          </div>
          <p className="text-white font-semibold text-sm">Mis citas</p>
          <p className="text-white/30 text-xs">Ver agenda</p>
        </Link>
        {user?.role === "BARBER" && (
          <>
            <Link href="/barber/servicios"
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-[#c9a227]/30 transition-all">
              <div className="w-10 h-10 bg-[#c9a227]/15 rounded-xl flex items-center justify-center">
                <Scissors size={20} className="text-[#c9a227]" />
              </div>
              <p className="text-white font-semibold text-sm">Mis servicios</p>
              <p className="text-white/30 text-xs">Gestionar catálogo</p>
            </Link>
            <Link href="/barber/horario"
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 hover:border-[#34d399]/30 transition-all">
              <div className="w-10 h-10 bg-[#34d399]/15 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-[#34d399]" />
              </div>
              <p className="text-white font-semibold text-sm">Mi horario</p>
              <p className="text-white/30 text-xs">Días y horas de trabajo</p>
            </Link>
          </>
        )}
      </div>

      {/* Upcoming appointments */}
      {Array.isArray(upcomingAppts) && upcomingAppts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold">Próximas citas</h2>
            <Link href="/citas" className="text-[#c9a227] text-sm hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {upcomingAppts.slice(0, 3).map((a: any) => (
              <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#a78bfa]/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Scissors size={16} className="text-[#a78bfa]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{a.service?.name ?? "Servicio"}</p>
                  <p className="text-white/40 text-xs">{a.barber?.user?.firstName} · {a.barbershop?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#c9a227] text-xs font-bold">
                    {new Date(a.scheduledAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(a.scheduledAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby shops */}
      {user?.role !== "BARBER" && Array.isArray(nearbyShops) && nearbyShops.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold">Barberías</h2>
            <Link href="/mapa" className="text-[#c9a227] text-sm hover:underline">Ver mapa</Link>
          </div>
          <div className="space-y-2">
            {nearbyShops.slice(0, 4).map((s: any) => (
              <Link key={s.id} href={`/barberia/${s.id}`}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 hover:border-[#c9a227]/30 transition-all">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                  {s.coverImageUrl
                    ? <img src={s.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Scissors size={18} className="text-[#c9a227]" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-white/40 text-xs flex items-center gap-1">
                    <MapPin size={10} />{s.address ?? s.city ?? "Colombia"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
