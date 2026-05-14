"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { MapPin } from "lucide-react";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" });
}
function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function BarbershopsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-barbershops", page],
    queryFn: () => adminApi.getBarbershops(page),
    retry: false,
  });

  const shops: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Barberías</h1>
        <p className="text-white/40 text-sm mt-1">{total} barberías registradas</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/30">Sin barberías</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((s) => (
              <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold">{s.name}</h3>
                    <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                      <MapPin size={11} />
                      {s.city ?? "—"}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.isActive ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/30"}`}>
                    {s.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-lg">{s._count?.barbers ?? 0}</p>
                    <p className="text-white/30 text-xs">Barberos</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-white font-bold text-lg">{s._count?.appointments ?? 0}</p>
                    <p className="text-white/30 text-xs">Citas</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-[#f472b6] font-bold text-xs leading-tight">{s.subscription?.plan?.name ?? "Sin plan"}</p>
                    <p className="text-white/30 text-xs">Plan</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>Propietario: {s.owner?.firstName} {s.owner?.lastName}</span>
                  <span>{fmt(s.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-sm">Página {page} de {totalPages || 1}</p>
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
