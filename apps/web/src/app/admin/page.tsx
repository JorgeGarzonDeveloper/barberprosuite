"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Users, Scissors, CreditCard, DollarSign, TrendingUp, Calendar } from "lucide-react";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getDashboard,
    retry: false,
  });

  const { data: breakdown } = useQuery({
    queryKey: ["admin-revenue-breakdown"],
    queryFn: adminApi.getRevenueBreakdown,
    retry: false,
  });

  const kpis = [
    { label: "Usuarios totales", value: (stats?.totalUsers ?? 0).toLocaleString("es-CO"), icon: Users, color: "#60a5fa", bg: "#60a5fa15" },
    { label: "Barberías activas", value: String(stats?.totalBarbershops ?? 0), icon: Scissors, color: "#c9a227", bg: "#c9a22715" },
    { label: "Suscripciones activas", value: String(stats?.activeSubscriptions ?? 0), icon: CreditCard, color: "#f472b6", bg: "#f472b615" },
    { label: "Citas totales", value: (stats?.totalAppointments ?? 0).toLocaleString("es-CO"), icon: Calendar, color: "#a78bfa", bg: "#a78bfa15" },
    { label: "Ingresos plataforma", value: fmtCOP(breakdown?.totalPlatformRevenue ?? stats?.totalRevenue ?? 0), icon: TrendingUp, color: "#4ade80", bg: "#4ade8015" },
    { label: "Nuevos usuarios este mes", value: String(stats?.newUsersThisMonth ?? 0), icon: Users, color: "#fb923c", bg: "#fb923c15" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Resumen general de BarberProSuite</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: kpi.bg }}>
                <kpi.icon size={22} style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">{kpi.label}</p>
                <p className="text-white text-xl font-bold">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue breakdown summary */}
      {breakdown && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-bold text-lg">Desglose de ingresos</h2>
              <p className="text-white/30 text-xs mt-0.5">Lo que es 100% ganancia tuya vs lo que pasas a barberos</p>
            </div>
          </div>

          {/* P&L compacto */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Suscripciones (100% tuyo)</span>
              <span className="text-green-400 font-semibold">{fmtCOP(breakdown.subscriptionRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Comisiones 10% de citas</span>
              <span className="text-[#c9a227] font-semibold">{fmtCOP(breakdown.commissionRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-2">
              <span className="text-white font-bold">= Ganancia neta plataforma</span>
              <span className="text-[#c9a227] font-black">{fmtCOP(breakdown.totalPlatformRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-2">
              <span className="text-white/40">Depósitos pendientes → barberos</span>
              <span className="text-orange-400 font-semibold">− {fmtCOP(breakdown.pendingBarberPayouts)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Suscripciones", value: fmtCOP(breakdown.subscriptionRevenue), sub: `${breakdown.subscriptionCount} pagos`, color: "#f472b6" },
              { label: "Comisiones", value: fmtCOP(breakdown.commissionRevenue), sub: `${breakdown.appointmentCount} citas`, color: "#c9a227" },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-white/40 text-xs mb-1">{item.label}</p>
                <p className="font-bold text-base" style={{ color: item.color }}>{item.value}</p>
                <p className="text-white/30 text-xs mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {(breakdown.pendingRefunds > 0 || breakdown.approvedRefunds > 0) && (
            <div className="mt-4 space-y-2">
              {breakdown.pendingRefunds > 0 && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm">
                  ⚠ <strong>{breakdown.pendingRefunds}</strong> devolución{breakdown.pendingRefunds !== 1 ? "es" : ""} pendiente{breakdown.pendingRefunds !== 1 ? "s" : ""} de revisar.
                </div>
              )}
              {breakdown.approvedRefunds > 0 && (
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-blue-400 text-sm">
                  ✓ <strong>{breakdown.approvedRefunds}</strong> devolución{breakdown.approvedRefunds !== 1 ? "es" : ""} aprobada{breakdown.approvedRefunds !== 1 ? "s" : ""} — verifica reembolso en Wompi.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
