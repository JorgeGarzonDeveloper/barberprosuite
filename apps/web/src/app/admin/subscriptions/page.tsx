"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#4ade80", TRIAL: "#60a5fa", EXPIRED: "#f87171", CANCELLED: "#6b7280", PENDING: "#f59e0b",
};

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", page],
    queryFn: () => adminApi.getSubscriptions(page),
    retry: false,
  });

  const subs: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Suscripciones</h1>
        <p className="text-white/40 text-sm mt-1">{total} suscripciones en total</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : subs.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/30">Sin suscripciones</p>
        </div>
      ) : (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-white/40 font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium hidden md:table-cell">Barbería</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium hidden lg:table-cell">Plan</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium">Estado</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium hidden md:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{s.user?.firstName} {s.user?.lastName}</p>
                      <p className="text-white/40 text-xs">{s.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs hidden md:table-cell">{s.barbershop?.name ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-[#f472b6]/10 text-[#f472b6]">{s.plan?.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: STATUS_COLORS[s.status] ?? "#6b7280", backgroundColor: `${STATUS_COLORS[s.status] ?? "#6b7280"}15` }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">{fmt(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
