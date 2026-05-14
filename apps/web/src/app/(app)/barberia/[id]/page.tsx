"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MapPin, Star, Clock, Scissors, ChevronLeft, Users, Calendar } from "lucide-react";
import Link from "next/link";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function BarbershopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "barbers" | "reviews">("info");

  const { data: shop, isLoading } = useQuery({
    queryKey: ["barbershop", id],
    queryFn: () => api.get(`/barbershops/${id}`).then((r) => r.data.data),
    retry: false,
  });

  const { data: services } = useQuery({
    queryKey: ["barbershop-services", id],
    queryFn: () => api.get(`/barbershops/${id}/services`).then((r) => r.data.data ?? []).catch(() => []),
    retry: false,
  });

  const { data: barbers } = useQuery({
    queryKey: ["barbershop-barbers", id],
    queryFn: () => api.get(`/users/barbers?barbershopId=${id}`).then((r) => r.data.data ?? []).catch(() => []),
    retry: false,
  });

  const { data: reviews } = useQuery({
    queryKey: ["barbershop-reviews", id],
    queryFn: () => api.get(`/barbershops/${id}/reviews`).then((r) => r.data.data?.reviews ?? []).catch(() => []),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-white/5 mb-4" />
        <div className="px-4 space-y-3">
          <div className="h-6 bg-white/5 rounded w-1/2" />
          <div className="h-4 bg-white/5 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!shop) return <div className="p-8 text-center text-white/40">Barbería no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="relative h-48 lg:h-64 bg-white/5 overflow-hidden">
        {shop.coverImageUrl || shop.bannerUrl
          ? <img src={shop.coverImageUrl ?? shop.bannerUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Scissors size={48} className="text-white/20" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="px-4 pb-8">
        {/* Info header */}
        <div className="py-4 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white mb-1">{shop.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
            {shop.address && <span className="flex items-center gap-1"><MapPin size={12} />{shop.address}</span>}
            {shop.averageRating > 0 && (
              <span className="flex items-center gap-1"><Star size={12} className="text-[#c9a227]" />{Number(shop.averageRating).toFixed(1)}</span>
            )}
            {shop.openTime && <span className="flex items-center gap-1"><Clock size={12} />{shop.openTime} – {shop.closeTime}</span>}
          </div>
          {shop.description && <p className="text-white/50 text-sm mt-2">{shop.description}</p>}
        </div>

        {/* Book CTA */}
        <div className="py-4 flex gap-3">
          <Link href={`/reservar/${id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl transition-colors">
            <Calendar size={18} /> Reservar cita
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-4">
          {[{ v: "info", l: "Servicios" }, { v: "barbers", l: "Barberos" }, { v: "reviews", l: "Reseñas" }].map((t) => (
            <button key={t.v} onClick={() => setTab(t.v as any)}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-all ${tab === t.v ? "border-[#c9a227] text-[#c9a227]" : "border-transparent text-white/40 hover:text-white"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Services */}
        {tab === "info" && (
          <div className="space-y-2">
            {!services?.length && <p className="text-white/30 text-sm text-center py-6">Sin servicios registrados</p>}
            {(services ?? []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                <div>
                  <p className="text-white font-semibold text-sm">{s.name}</p>
                  {s.description && <p className="text-white/40 text-xs mt-0.5">{s.description}</p>}
                  {s.durationMinutes && <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1"><Clock size={10} />{s.durationMinutes} min</p>}
                </div>
                <p className="text-[#c9a227] font-bold">{fmtCOP(s.price ?? 0)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Barbers */}
        {tab === "barbers" && (
          <div className="space-y-3">
            {!barbers?.length && <p className="text-white/30 text-sm text-center py-6">Sin barberos registrados</p>}
            {(barbers ?? []).map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {b.user?.avatarUrl
                    ? <img src={b.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[#c9a227] text-lg font-bold">{b.user?.firstName?.[0]}</span>}
                </div>
                <div>
                  <p className="text-white font-semibold">{b.user?.firstName} {b.user?.lastName}</p>
                  {b.bio && <p className="text-white/40 text-xs mt-0.5">{b.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {tab === "reviews" && (
          <div className="space-y-3">
            {!reviews?.length && <p className="text-white/30 text-sm text-center py-6">Sin reseñas aún</p>}
            {(reviews ?? []).map((r: any) => (
              <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className={s <= r.rating ? "text-[#c9a227] fill-[#c9a227]" : "text-white/20"} />
                    ))}
                  </div>
                  <span className="text-white/40 text-xs">{r.client?.user?.firstName}</span>
                </div>
                {r.comment && <p className="text-white/60 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
